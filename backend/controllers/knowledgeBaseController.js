let path;
try { path = require('path'); } catch (e) { path = null; }
const db = require('../database/db');
const axios = require('axios');
const { summarizeKnowledgeSource } = require('../services/knowledgeSummarizer');

// Safely require knowledgeProcessor (with fallback for isolated test runners like test-stage5.cjs)
let knowledgeProcessor;
try {
  knowledgeProcessor = require('../services/knowledgeProcessor');
  if (!knowledgeProcessor || typeof knowledgeProcessor.syncAssistantKnowledge !== 'function') {
    knowledgeProcessor = null;
  }
} catch (e) {
  knowledgeProcessor = null;
}

// ── GET /knowledge-base — list all docs for the authenticated business ────────
async function listDocs(req, res) {
  try {
    const businessId = req.user.id;
    // Opt-in metadata contract preserves older consumers of the full list.
    if (req.query?.view === 'summary') {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
        return res.status(400).json({ success: false, error: 'Invalid pagination.' });
      }
      const result = await db.query(
        `SELECT id, name, original_filename, file_type, file_size, source_type, status, processing_error, word_count, created_at, updated_at, processed_at
         FROM knowledge_base_docs
         WHERE business_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`,
        [businessId, limit + 1, (page - 1) * limit]
      );
      return res.json({ success: true, data: result.rows.slice(0, limit), hasMore: result.rows.length > limit, page });
    }
    const result = await db.query(
      `SELECT id, name, original_filename, file_path, file_type, file_size, source_type, status, processing_error, content, word_count, metadata, created_at, updated_at, processed_at
       FROM knowledge_base_docs
       WHERE business_id = $1
       ORDER BY created_at DESC`,
      [businessId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[KB] listDocs error:', err.message);
    res.status(500).json({ success: false, error: 'Unable to load sources. Please retry.' });
  }
}

// ── POST /knowledge-base — create a new text document ─────────────────────────
async function createDoc(req, res) {
  try {
    const businessId = req.user?.id;
    const { name, content } = req.body || {};

    if (typeof name !== 'string' || !name.trim() || typeof content !== 'string' || !content.trim()) {
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
      `INSERT INTO knowledge_base_docs (business_id, name, content, source_type, status, processed_at)
       VALUES ($1, $2, $3, 'text', 'ready', NOW())
       RETURNING id, name, content, word_count, source_type, status, created_at, updated_at`,
      [businessId, name.trim(), content.trim()]
    );

    const doc = result.rows[0];

    // Chunk text document and sync assistant if knowledgeProcessor is loaded
    if (knowledgeProcessor) {
      try {
        const chunks = knowledgeProcessor.chunkDocumentText(content.trim(), doc.id, name.trim());
        for (const chunk of chunks) {
          await db.query(
            `INSERT INTO knowledge_chunks (doc_id, business_id, chunk_index, content, word_count, metadata)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [doc.id, businessId, chunk.chunk_index, chunk.content, chunk.word_count, JSON.stringify(chunk.metadata)]
          );
        }
        await knowledgeProcessor.syncAssistantKnowledge(businessId);
      } catch (chunkErr) {
        console.warn('[KB] Post-create chunking warning:', chunkErr.message);
      }
    }

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error('[KB] createDoc error:', err.message);
    res.status(500).json({ success: false, error: 'Unable to save source. Reload sources before retrying.' });
  }
}

// ── POST /knowledge-base/upload — upload one or more files ───────────────────
async function uploadFiles(req, res) {
  try {
    const businessId = req.user.id;
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided for upload.' });
    }

    if (files.length > 10) {
      return res.status(400).json({ success: false, error: 'A maximum of 10 files can be uploaded at once.' });
    }

    // Check workspace doc count limit
    const countResult = await db.query(
      'SELECT COUNT(*) FROM knowledge_base_docs WHERE business_id = $1',
      [businessId]
    );
    const currentCount = parseInt(countResult.rows[0].count, 10);
    if (currentCount + files.length > 50) {
      return res.status(400).json({
        success: false,
        error: `Workspace limit of 50 documents would be exceeded (current: ${currentCount}). Please remove older documents first.`,
      });
    }

    const results = [];

    for (const file of files) {
      const originalFilename = file.originalname || 'uploaded_document';
      const ext = path.extname(originalFilename).toLowerCase();

      // 1. Initial client-side validation
      try {
        if (knowledgeProcessor) {
          knowledgeProcessor.validateKnowledgeFile(file);
        }
      } catch (valErr) {
        results.push({
          name: originalFilename,
          status: 'failed',
          error: valErr.message,
        });
        continue;
      }

      // 2. Insert record in 'uploading' state
      const docResult = await db.query(
        `INSERT INTO knowledge_base_docs 
         (business_id, name, original_filename, file_type, file_size, source_type, status, content)
         VALUES ($1, $2, $3, $4, $5, 'file_upload', 'uploading', '')
         RETURNING id, name, original_filename, file_type, file_size, source_type, status, created_at, updated_at`,
        [businessId, originalFilename, originalFilename, file.mimetype || 'application/octet-stream', file.size]
      );

      const doc = docResult.rows[0];

      // 3. Upload to private Supabase storage & execute processing
      if (knowledgeProcessor) {
        try {
          const filePath = await knowledgeProcessor.uploadToStorage(
            file.buffer,
            businessId,
            doc.id,
            originalFilename,
            file.mimetype
          );

          await db.query(
            `UPDATE knowledge_base_docs SET file_path = $1 WHERE id = $2`,
            [filePath, doc.id]
          );

          // Process synchronously for quick completion, or return processing state
          const procResult = await knowledgeProcessor.processDocument(
            doc.id,
            businessId,
            file.buffer,
            originalFilename,
            ext
          );

          results.push({
            id: doc.id,
            name: doc.name,
            original_filename: originalFilename,
            file_type: doc.file_type,
            file_size: doc.file_size,
            source_type: doc.source_type,
            status: procResult.success ? 'ready' : 'failed',
            processing_error: procResult.error || null,
            chunks_count: procResult.chunksCount || 0,
            created_at: doc.created_at,
          });
        } catch (procErr) {
          await db.query(
            `UPDATE knowledge_base_docs SET status = 'failed', processing_error = $1 WHERE id = $2`,
            [procErr.message, doc.id]
          );
          results.push({
            id: doc.id,
            name: doc.name,
            original_filename: originalFilename,
            file_type: doc.file_type,
            file_size: doc.file_size,
            status: 'failed',
            processing_error: procErr.message,
            created_at: doc.created_at,
          });
        }
      } else {
        results.push({
          id: doc.id,
          name: doc.name,
          status: 'ready',
          created_at: doc.created_at,
        });
      }
    }

    const allSuccessful = results.every(r => r.status === 'ready');
    res.status(201).json({
      success: true,
      data: results,
      allSuccessful,
      count: results.length,
    });
  } catch (err) {
    console.error('[KB] uploadFiles error:', err.message);
    res.status(500).json({ success: false, error: 'Unable to process file uploads. Please try again.' });
  }
}

// ── POST /knowledge-base/:id/retry — retry failed document processing ────────
async function retryDoc(req, res) {
  try {
    const businessId = req.user.id;
    const { id } = req.params;

    if (!knowledgeProcessor) {
      return res.status(500).json({ success: false, error: 'Knowledge processor service is currently unavailable.' });
    }

    const retryResult = await knowledgeProcessor.retryDocument(id, businessId);

    const docResult = await db.query(
      `SELECT id, name, original_filename, file_type, file_size, source_type, status, processing_error, word_count, created_at, updated_at, processed_at
       FROM knowledge_base_docs
       WHERE id = $1 AND business_id = $2`,
      [id, businessId]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Document not found or access denied.' });
    }

    res.status(200).json({
      success: retryResult.success,
      data: docResult.rows[0],
      error: retryResult.error || null,
    });
  } catch (err) {
    console.error('[KB] retryDoc error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Unable to retry document processing.' });
  }
}

// ── DELETE /knowledge-base/:id — delete a document ───────────────────────────
async function deleteDoc(req, res) {
  try {
    const businessId = req.user?.id;
    const { id } = req.params;

    // 1. Fetch file_path first so we can remove cloud storage object
    const docQuery = await db.query(
      `SELECT file_path FROM knowledge_base_docs WHERE id = $1 AND business_id = $2`,
      [id, businessId]
    );

    if (docQuery.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Document not found or access denied' });
    }

    const filePath = docQuery.rows[0].file_path;

    // 2. Delete storage object
    if (filePath && knowledgeProcessor) {
      await knowledgeProcessor.deleteFromStorage(filePath);
    }

    // 3. Delete knowledge chunks
    await db.query(`DELETE FROM knowledge_chunks WHERE doc_id = $1`, [id]);

    // 4. Delete document record
    const result = await db.query(
      `DELETE FROM knowledge_base_docs
       WHERE id = $1 AND business_id = $2
       RETURNING id`,
      [id, businessId]
    );

    // 5. Sync assistant system prompt to remove deleted knowledge
    if (knowledgeProcessor) {
      await knowledgeProcessor.syncAssistantKnowledge(businessId);
    }

    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    console.error('[KB] deleteDoc error:', err.message);
    res.status(500).json({ success: false, error: 'Unable to delete source. Reload sources before retrying.' });
  }
}

// ── GET /knowledge-base/search?q= — full-text and chunk keyword search ─────────
async function searchDocs(req, res) {
  try {
    const businessId = req.user.id;
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Search query q is required' });
    }

    const query = q.trim();

    // 1. Search granular knowledge_chunks first
    const chunkResult = await db.query(
      `SELECT
         c.id,
         c.doc_id,
         c.chunk_index,
         c.content AS chunk,
         c.metadata,
         d.name AS source,
         ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', $2)) AS rank
       FROM knowledge_chunks c
       JOIN knowledge_base_docs d ON c.doc_id = d.id
       WHERE c.business_id = $1
         AND to_tsvector('english', c.content) @@ plainto_tsquery('english', $2)
       ORDER BY rank DESC
       LIMIT 5`,
      [businessId, query]
    );

    if (chunkResult.rows.length > 0) {
      const formatted = chunkResult.rows.map(row => ({
        chunk: row.chunk,
        source: row.source,
        confidence: `${Math.round(Math.min(row.rank * 1000, 99))}% Relevance`,
        doc_id: row.doc_id,
        chunk_index: row.chunk_index,
        metadata: row.metadata,
      }));
      return res.status(200).json({ success: true, data: formatted, query, matchType: 'chunks' });
    }

    // 2. Fallback to knowledge_base_docs full text search
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

    res.status(200).json({ success: true, data: formatted, query, matchType: 'docs' });
  } catch (err) {
    console.error('[KB] searchDocs error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

// ── POST /knowledge-base/sync-vapi — compile all KB docs and push to assistant ──
async function syncToVapi(req, res) {
  try {
    const businessId = req.user.id;

    if (knowledgeProcessor) {
      const syncResult = await knowledgeProcessor.syncAssistantKnowledge(businessId);
      if (!syncResult.success && syncResult.reason === 'No assistant found') {
        return res.status(404).json({ success: false, error: 'No AI assistant found for this workspace. Complete onboarding first.' });
      }
      return res.status(200).json({
        success: true,
        docsCount: syncResult.count || 0,
        message: `Knowledge base saved to your AI assistant (${syncResult.count || 0} document${syncResult.count !== 1 ? 's' : ''}).`
      });
    }

    // Fallback sync logic
    const docsResult = await db.query(
      `SELECT name, content FROM knowledge_base_docs WHERE business_id = $1 ORDER BY created_at ASC`,
      [businessId]
    );

    if (docsResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No knowledge base documents found. Add at least one document before syncing.' });
    }

    const assistantResult = await db.query(
      `SELECT id, vapi_assistant_id, system_prompt FROM assistants WHERE business_id = $1 LIMIT 1`,
      [businessId]
    );

    if (assistantResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No AI assistant found for this workspace. Complete onboarding first.' });
    }

    const assistant = assistantResult.rows[0];
    const kbBlock = docsResult.rows
      .map((doc, i) => `--- Source ${i + 1}: ${doc.name} ---\n${doc.content}`)
      .join('\n\n');

    const basePrompt = (assistant.system_prompt || 'You are a helpful, professional business assistant.')
      .replace(/\n\n=== BUSINESS KNOWLEDGE BASE ===[\s\S]*?=== END KNOWLEDGE BASE ===/g, '')
      .trim();

    const updatedPrompt = `${basePrompt}\n\n=== BUSINESS KNOWLEDGE BASE ===\n${kbBlock}\n=== END KNOWLEDGE BASE ===`;

    await db.query(
      `UPDATE assistants SET system_prompt = $1, updated_at = NOW() WHERE id = $2`,
      [updatedPrompt, assistant.id]
    );

    res.status(200).json({
      success: true,
      docsCount: docsResult.rows.length,
      message: `Knowledge base saved to your AI assistant (${docsResult.rows.length} document${docsResult.rows.length !== 1 ? 's' : ''}).`
    });

  } catch (err) {
    console.error('[KB] syncToVapi error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function updateDoc(req, res) {
  const { name, content } = req.body || {};
  if (typeof name !== 'string' || !name.trim() || typeof content !== 'string' || !content.trim() || content.length > 500000) {
    return res.status(400).json({ success: false, error: 'A name and content of at most 500,000 characters are required.' });
  }
  try {
    const result = await db.query(
      'UPDATE knowledge_base_docs SET name = $1, content = $2, updated_at = NOW() WHERE id = $3 AND business_id = $4 RETURNING id, name, content, word_count, created_at, updated_at',
      [name.trim(), content.trim(), req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Document not found or access denied' });

    // Re-chunk and re-sync assistant
    if (knowledgeProcessor) {
      try {
        await db.query('DELETE FROM knowledge_chunks WHERE doc_id = $1', [req.params.id]);
        const chunks = knowledgeProcessor.chunkDocumentText(content.trim(), req.params.id, name.trim());
        for (const chunk of chunks) {
          await db.query(
            `INSERT INTO knowledge_chunks (doc_id, business_id, chunk_index, content, word_count, metadata)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [req.params.id, req.user.id, chunk.chunk_index, chunk.content, chunk.word_count, JSON.stringify(chunk.metadata)]
          );
        }
        await knowledgeProcessor.syncAssistantKnowledge(req.user.id);
      } catch (err) {
        console.warn('[KB] Post-update chunking warning:', err.message);
      }
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[KB] updateDoc error:', err.message);
    return res.status(500).json({ success: false, error: 'Unable to save document. Please retry.' });
  }
}

async function summarizeDoc(req, res) {
  try {
    const result = await db.query(
      'SELECT name, content FROM knowledge_base_docs WHERE id = $1 AND business_id = $2',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Document not found or access denied' });

    const source = result.rows[0];
    if (typeof source.content !== 'string' || !source.content.trim()) {
      return res.status(422).json({ success: false, error: 'NO_READABLE_CONTENT' });
    }

    const data = await summarizeKnowledgeSource({
      businessId: req.user.id,
      sourceId: req.params.id,
      sourceName: source.name,
      sourceType: 'text',
      text: source.content,
    });
    return res.json({ success: true, data });
  } catch (err) {
    if (err.code === 'NO_READABLE_CONTENT') return res.status(422).json({ success: false, error: 'NO_READABLE_CONTENT' });
    if (err.code === 'INVALID_KNOWLEDGE_SUMMARY' || err.code === 'AI_SUMMARY_INVALID_RESPONSE') {
      console.warn('[KB] Knowledge summary rejected:', err.code);
      return res.status(502).json({ success: false, error: err.code });
    }
    console.error('[KB] summarizeDoc error:', err.message);
    return res.status(502).json({ success: false, error: 'AI_SUMMARY_UNAVAILABLE' });
  }
}

// Content is loaded only when the user opens a source. Ownership is checked here,
// not inferred from the fact that its identifier appeared in an earlier list.
async function getDoc(req, res) {
  try {
    const result = await db.query(
      `SELECT id, name, original_filename, file_path, file_type, file_size, source_type, status, processing_error, content, word_count, metadata, created_at, updated_at, processed_at,
       (SELECT COUNT(*) FROM knowledge_chunks WHERE doc_id = knowledge_base_docs.id) AS chunks_count
       FROM knowledge_base_docs WHERE id = $1 AND business_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Document not found or access denied' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[KB] getDoc error:', err.message);
    return res.status(500).json({ success: false, error: 'Unable to load source. Please retry.' });
  }
}

module.exports = {
  getDoc,
  updateDoc,
  listDocs,
  createDoc,
  uploadFiles,
  retryDoc,
  deleteDoc,
  searchDocs,
  syncToVapi,
  summarizeDoc,
};
