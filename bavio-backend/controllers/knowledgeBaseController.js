const db = require('../database/db');

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

    // PostgreSQL full-text search
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

module.exports = {
  listDocs,
  createDoc,
  deleteDoc,
  searchDocs,
};
