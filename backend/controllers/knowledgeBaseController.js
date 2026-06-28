const db = require('../database/db');
const axios = require('axios');

// ── GET /knowledge-base — list all docs for the authenticated business ────────
async function listDocs(req, res) {
  try {
    const businessId = req.user.id;
    const result = await db.query(
      `SELECT id, name, content, word_count, created_at, updated_at
       FROM knowledge_base_docs
       WHERE business_id = $1
       ORDER BY created_at DESC`,
      [businessId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[KB] listDocs error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ── POST /knowledge-base — create a new text document ─────────────────────────
async function createDoc(req, res) {
  try {
    const businessId = req.user.id;
    const { name, content } = req.body;

    if (!name || !content) {
      return res.status(400).json({ success: false, error: 'name and content are required' });
    }

    if (content.length > 500000) {
      return res.status(400).json({ success: false, error: 'Document content exceeds 500,000 character limit' });
    }

    // Check limit (max 50 docs per business)
    const countResult = await db.query(
      'SELECT COUNT(*) FROM knowledge_base_docs WHERE business_id = $1',
      [businessId]
    );
    if (parseInt(countResult.rows[0].count) >= 50) {
      return res.status(400).json({ success: false, error: 'Maximum 50 documents per workspace reached. Delete existing documents to add new ones.' });
    }

    const result = await db.query(
      `INSERT INTO knowledge_base_docs (business_id, name, content)
       VALUES ($1, $2, $3)
       RETURNING id, name, content, word_count, created_at, updated_at`,
      [businessId, name.trim(), content.trim()]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[KB] createDoc error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ── DELETE /knowledge-base/:id — delete a document ───────────────────────────
async function deleteDoc(req, res) {
  try {
    const businessId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM knowledge_base_docs
       WHERE id = $1 AND business_id = $2
       RETURNING id`,
      [id, businessId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Document not found or access denied' });
    }

    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    console.error('[KB] deleteDoc error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ── GET /knowledge-base/search?q= — full-text keyword search ─────────────────
async function searchDocs(req, res) {
  try {
    const businessId = req.user.id;
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Search query q is required' });
    }

    const query = q.trim();

    const result = await db.query(
      `SELECT
         id,
         name,
         ts_headline('english', content, plainto_tsquery('english', $2),
           'MaxWords=30, MinWords=15, StartSel=«, StopSel=»'
         ) AS chunk,
         ts_rank(to_tsvector('english', name || ' ' || content), plainto_tsquery('english', $2)) AS rank
       FROM knowledge_base_docs
       WHERE business_id = $1
         AND to_tsvector('english', name || ' ' || content) @@ plainto_tsquery('english', $2)
       ORDER BY rank DESC
       LIMIT 5`,
      [businessId, query]
    );

    const formatted = result.rows.map(row => ({
      chunk: row.chunk.replace(/[«»]/g, '"'),
      source: row.name,
      confidence: `${Math.round(Math.min(row.rank * 1000, 99))}% Relevance`,
      doc_id: row.id,
    }));

    res.status(200).json({ success: true, data: formatted, query });
  } catch (err) {
    console.error('[KB] searchDocs error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ── POST /knowledge-base/sync-vapi — compile all KB docs and push to VAPI assistant ──
async function syncToVapi(req, res) {
  try {
    const businessId = req.user.id;

    // 1. Fetch all KB docs for this business
    const docsResult = await db.query(
      `SELECT name, content FROM knowledge_base_docs WHERE business_id = $1 ORDER BY created_at ASC`,
      [businessId]
    );

    if (docsResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No knowledge base documents found. Add at least one document before syncing.' });
    }

    // 2. Fetch the business assistant record (with vapi_assistant_id)
    const assistantResult = await db.query(
      `SELECT id, vapi_assistant_id, system_prompt FROM assistants WHERE business_id = $1 LIMIT 1`,
      [businessId]
    );

    if (assistantResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No AI assistant found for this workspace. Complete onboarding first.' });
    }

    const assistant = assistantResult.rows[0];

    // 3. Build the knowledge base context block
    const kbBlock = docsResult.rows
      .map((doc, i) => `--- Source ${i + 1}: ${doc.name} ---\n${doc.content}`)
      .join('\n\n');

    // 4. Compose updated system prompt — strip any previous KB block first
    const basePrompt = (assistant.system_prompt || 'You are a helpful, professional business assistant.')
      .replace(/\n\n=== BUSINESS KNOWLEDGE BASE ===[\s\S]*?=== END KNOWLEDGE BASE ===/g, '')
      .trim();

    const updatedPrompt = `${basePrompt}\n\n=== BUSINESS KNOWLEDGE BASE ===\n${kbBlock}\n=== END KNOWLEDGE BASE ===`;

    // 5. Update locally in DB
    await db.query(
      `UPDATE assistants SET system_prompt = $1, updated_at = NOW() WHERE id = $2`,
      [updatedPrompt, assistant.id]
    );

    // 6. Sync to VAPI if a real VAPI assistant ID and API key are available
    let vapiSynced = false;
    const vapiAssistantId = assistant.vapi_assistant_id;
    const vapiApiKey = process.env.VAPI_API_KEY;

    if (vapiApiKey && vapiAssistantId && !String(vapiAssistantId).startsWith('vapi_asst_mock_')) {
      try {
        await axios.patch(
          `https://api.vapi.ai/assistant/${vapiAssistantId}`,
          { model: { messages: [{ role: 'system', content: updatedPrompt }] } },
          { headers: { 'Authorization': `Bearer ${vapiApiKey}`, 'Content-Type': 'application/json' } }
        );
        vapiSynced = true;
        console.log(`[KB SYNC] ✅ Pushed to VAPI assistant ${vapiAssistantId} for business ${businessId}`);
      } catch (vapiErr) {
        // DB was updated; VAPI sync failed non-fatally
        console.error('[KB SYNC] VAPI push failed (DB still updated):', vapiErr.message);
      }
    } else {
      console.log(`[KB SYNC] No real VAPI assistant ID/key — DB updated only. vapiId: ${vapiAssistantId}`);
    }

    res.status(200).json({
      success: true,
      docsCount: docsResult.rows.length,
      vapiSynced,
      message: vapiSynced
        ? `Knowledge base synced to your AI assistant (${docsResult.rows.length} document${docsResult.rows.length !== 1 ? 's' : ''}).`
        : `Knowledge base saved to your AI assistant (${docsResult.rows.length} document${docsResult.rows.length !== 1 ? 's' : ''}). VAPI live-sync pending API key setup.`
    });

  } catch (err) {
    console.error('[KB] syncToVapi error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  listDocs,
  createDoc,
  deleteDoc,
  searchDocs,
  syncToVapi,
};
