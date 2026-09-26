const path = require('path');
const XLSX = require('xlsx');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const db = require('../database/db');
const supabase = require('../config/supabase');

const KNOWLEDGE_BUCKET = 'knowledge-files';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const SUPPORTED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xlsx',
  '.csv',
  '.png',
  '.jpg',
  '.jpeg',
]);

const MIME_TO_EXT = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xlsx',
  'text/csv': '.csv',
  'text/plain': '.csv',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
};

/**
 * Validate incoming file before storage/processing
 */
function validateKnowledgeFile(file) {
  if (!file || !file.buffer || !file.originalname) {
    throw new Error('No valid file was provided for upload.');
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(`File type "${ext}" is not supported. Please upload a PDF, DOC, DOCX, XLSX, CSV, PNG, or JPG.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File "${file.originalname}" exceeds the 25 MB size limit.`);
  }

  return { valid: true, ext };
}

/**
 * Upload raw file to Supabase Storage in private bucket
 */
async function uploadToStorage(buffer, businessId, docId, originalFilename, mimeType) {
  const sanitized = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `knowledge/${businessId}/${docId}/${sanitized}`;

  const { error } = await supabase.storage
    .from(KNOWLEDGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: mimeType || 'application/octet-stream',
      upsert: true,
    });

  if (error) {
    console.error('[KnowledgeProcessor] Supabase storage upload failed:', error.message);
    throw new Error(`Failed to store file in cloud storage: ${error.message}`);
  }

  return filePath;
}

/**
 * Delete file from Supabase Storage
 */
async function deleteFromStorage(filePath) {
  if (!filePath) return;
  try {
    await supabase.storage.from(KNOWLEDGE_BUCKET).remove([filePath]);
  } catch (err) {
    console.warn('[KnowledgeProcessor] Delete storage file warning:', err.message);
  }
}

/**
 * Download file buffer from Supabase Storage
 */
async function downloadFromStorage(filePath) {
  const { data, error } = await supabase.storage
    .from(KNOWLEDGE_BUCKET)
    .download(filePath);

  if (error || !data) {
    throw new Error(`Failed to download file from storage: ${error?.message || 'Empty file'}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Extract clean textual content from supported file formats
 */
async function extractDocumentContent(buffer, filename, ext) {
  const normalizedExt = ext.toLowerCase();

  switch (normalizedExt) {
    case '.pdf': {
      try {
        const parsed = await pdfParse(buffer);
        const text = normalizeExtractedText(parsed.text);
        if (!text || text.length < 5) {
          throw new Error('The PDF document contains no readable text or is image-only.');
        }
        return {
          text,
          pageCount: parsed.numpages || 1,
          info: parsed.info || {},
        };
      } catch (err) {
        if (err.message && err.message.includes('readable text')) throw err;
        throw new Error('This PDF document could not be read or is corrupt.');
      }
    }

    case '.docx': {
      try {
        const result = await mammoth.extractRawText({ buffer });
        const text = normalizeExtractedText(result.value);
        if (!text || text.length < 5) {
          throw new Error('The Word document contains no readable text.');
        }
        return { text };
      } catch (err) {
        if (err.message && err.message.includes('readable text')) throw err;
        throw new Error('This Word document (.docx) could not be read or is corrupt.');
      }
    }

    case '.doc': {
      // Legacy binary .doc — attempt utf-8 text extraction or binary text stream
      const raw = buffer.toString('utf-8').replace(/[^\x20-\x7E\t\n\r]/g, ' ');
      const text = normalizeExtractedText(raw);
      if (!text || text.length < 20) {
        throw new Error('Legacy .doc format could not be parsed. Please convert to .docx or .pdf.');
      }
      return { text };
    }

    case '.xlsx': {
      try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Excel workbook contains no sheets.');
        }

        const sections = [];
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const csvData = XLSX.utils.sheet_to_csv(sheet);
          if (csvData && csvData.trim()) {
            sections.push(`=== Sheet: ${sheetName} ===\n${csvData.trim()}`);
          }
        }

        const text = normalizeExtractedText(sections.join('\n\n'));
        if (!text || text.length < 5) {
          throw new Error('The spreadsheet contains no readable cell data.');
        }

        return {
          text,
          sheetCount: workbook.SheetNames.length,
          sheetNames: workbook.SheetNames,
        };
      } catch (err) {
        if (err.message && err.message.includes('readable')) throw err;
        throw new Error('This Excel spreadsheet (.xlsx) could not be read or is corrupt.');
      }
    }

    case '.csv': {
      try {
        const raw = buffer.toString('utf-8');
        const text = normalizeExtractedText(raw);
        if (!text || text.length < 5) {
          throw new Error('The CSV file contains no readable data.');
        }
        return { text };
      } catch (err) {
        throw new Error('This CSV file could not be read.');
      }
    }

    case '.png':
    case '.jpg':
    case '.jpeg': {
      // As per system specifications:
      // "If OCR is not currently available, do NOT pretend image processing succeeded.
      // Mark the source appropriately as unsupported/pending OCR or provide a real processing error."
      throw new Error('Image OCR extraction is not currently configured. Please upload a PDF, DOCX, XLSX, or CSV document.');
    }

    default:
      throw new Error(`File format ${ext} is not supported.`);
  }
}

/**
 * Clean up extracted document text
 */
function normalizeExtractedText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u00A0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Split text into semantic chunks with overlap for retrieval
 */
function chunkDocumentText(text, docId, filename, metadata = {}) {
  const CHUNK_SIZE = 800; // characters
  const CHUNK_OVERLAP = 150; // characters

  const chunks = [];
  const paragraphs = text.split('\n\n');
  let currentChunk = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length + 2 <= CHUNK_SIZE) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmed}` : trimmed;
    } else {
      if (currentChunk) {
        chunks.push({
          doc_id: docId,
          chunk_index: chunkIndex++,
          content: currentChunk,
          word_count: currentChunk.split(/\s+/).filter(Boolean).length,
          metadata: {
            ...metadata,
            source_id: docId,
            filename,
            char_count: currentChunk.length,
          },
        });
      }

      // If single paragraph is larger than CHUNK_SIZE, split by sentences
      if (trimmed.length > CHUNK_SIZE) {
        const sentences = trimmed.split(/(?<=[.?!])\s+/);
        currentChunk = '';
        for (const sent of sentences) {
          if (currentChunk.length + sent.length + 1 <= CHUNK_SIZE) {
            currentChunk = currentChunk ? `${currentChunk} ${sent}` : sent;
          } else {
            if (currentChunk) {
              chunks.push({
                doc_id: docId,
                chunk_index: chunkIndex++,
                content: currentChunk,
                word_count: currentChunk.split(/\s+/).filter(Boolean).length,
                metadata: {
                  ...metadata,
                  source_id: docId,
                  filename,
                  char_count: currentChunk.length,
                },
              });
            }
            currentChunk = sent;
          }
        }
      } else {
        currentChunk = trimmed;
      }
    }
  }

  // Push remaining chunk
  if (currentChunk.trim()) {
    chunks.push({
      doc_id: docId,
      chunk_index: chunkIndex,
      content: currentChunk.trim(),
      word_count: currentChunk.split(/\s+/).filter(Boolean).length,
      metadata: {
        ...metadata,
        source_id: docId,
        filename,
        char_count: currentChunk.length,
      },
    });
  }

  // Fallback: if document was small and produced 0 chunks, add whole text as 1 chunk
  if (chunks.length === 0 && text.trim()) {
    chunks.push({
      doc_id: docId,
      chunk_index: 0,
      content: text.trim(),
      word_count: text.split(/\s+/).filter(Boolean).length,
      metadata: {
        ...metadata,
        source_id: docId,
        filename,
        char_count: text.length,
      },
    });
  }

  return chunks;
}

/**
 * Re-compile ready knowledge base sources and sync to the AI Assistant
 */
async function syncAssistantKnowledge(businessId) {
  try {
    const docsResult = await db.query(
      `SELECT name, content FROM knowledge_base_docs 
       WHERE business_id = $1 AND status = 'ready' 
       ORDER BY created_at ASC`,
      [businessId]
    );

    const assistantResult = await db.query(
      `SELECT id, system_prompt FROM assistants WHERE business_id = $1 LIMIT 1`,
      [businessId]
    );

    if (assistantResult.rows.length === 0) {
      return { success: false, reason: 'No assistant found' };
    }

    const assistant = assistantResult.rows[0];
    const kbBlock = docsResult.rows.length > 0
      ? docsResult.rows
          .map((doc, i) => `--- Source ${i + 1}: ${doc.name} ---\n${doc.content.slice(0, 10000)}`)
          .join('\n\n')
      : '';

    const basePrompt = (assistant.system_prompt || 'You are a helpful, professional business assistant.')
      .replace(/\n\n=== BUSINESS KNOWLEDGE BASE ===[\s\S]*?=== END KNOWLEDGE BASE ===/g, '')
      .trim();

    const updatedPrompt = kbBlock
      ? `${basePrompt}\n\n=== BUSINESS KNOWLEDGE BASE ===\n${kbBlock}\n=== END KNOWLEDGE BASE ===`
      : basePrompt;

    await db.query(
      `UPDATE assistants SET system_prompt = $1, updated_at = NOW() WHERE id = $2`,
      [updatedPrompt, assistant.id]
    );

    return { success: true, count: docsResult.rows.length };
  } catch (err) {
    console.error('[KnowledgeProcessor] syncAssistantKnowledge error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Process a document record from buffer end-to-end
 */
async function processDocument(arg1, arg2, arg3, arg4, arg5) {
  let docId, businessId, buffer, filename, ext;
  if (typeof arg1 === 'object' && arg1 !== null) {
    docId = arg1.docId;
    businessId = arg1.businessId;
    buffer = arg1.buffer;
    filename = arg1.filename || arg1.name;
    ext = arg1.ext || (arg1.fileType ? (arg1.fileType.startsWith('.') ? arg1.fileType : '.' + arg1.fileType) : path.extname(filename || '').toLowerCase());
  } else {
    docId = arg1;
    businessId = arg2;
    buffer = arg3;
    filename = arg4;
    ext = arg5 || path.extname(filename || '').toLowerCase();
  }

  // 1. Mark status as processing
  await db.query(
    `UPDATE knowledge_base_docs 
     SET status = 'processing', processing_error = NULL, updated_at = NOW() 
     WHERE id = $1 AND business_id = $2`,
    [docId, businessId]
  );

  try {
    // 2. Extract content
    const extraction = await extractDocumentContent(buffer, filename, ext);
    const content = extraction.text;
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    // 3. Generate retrieval chunks
    const chunks = chunkDocumentText(content, docId, filename, {
      pageCount: extraction.pageCount,
      sheetCount: extraction.sheetCount,
      sheetNames: extraction.sheetNames,
    });

    // 4. Atomic chunk storage (idempotent: clean old chunks first)
    await db.query('DELETE FROM knowledge_chunks WHERE doc_id = $1', [docId]);

    const CHUNK_BATCH_SIZE = 25;
    for (let i = 0; i < chunks.length; i += CHUNK_BATCH_SIZE) {
      const batch = chunks.slice(i, i + CHUNK_BATCH_SIZE);
      const values = [];
      const params = [];
      batch.forEach((chunk, idx) => {
        const offset = idx * 6;
        values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
        params.push(docId, businessId, chunk.chunk_index, chunk.content, chunk.word_count, JSON.stringify(chunk.metadata));
      });
      await db.query(
        `INSERT INTO knowledge_chunks (doc_id, business_id, chunk_index, content, word_count, metadata)
         VALUES ${values.join(', ')}`,
        params
      );
    }

    // 5. Update doc record to READY
    const metadataUpdate = {
      pageCount: extraction.pageCount,
      sheetCount: extraction.sheetCount,
      sheetNames: extraction.sheetNames,
      totalChunks: chunks.length,
      extractedAt: new Date().toISOString(),
    };

    await db.query(
      `UPDATE knowledge_base_docs 
       SET status = 'ready',
           content = $1,
           metadata = $2,
           processing_error = NULL,
           processed_at = NOW(),
           updated_at = NOW()
       WHERE id = $3 AND business_id = $4`,
      [content.slice(0, 500000), JSON.stringify(metadataUpdate), docId, businessId]
    );

    // 6. Sync to agent
    await syncAssistantKnowledge(businessId);

    console.log(`[KnowledgeProcessor] Document ${docId} ("${filename}") processed successfully: ${chunks.length} chunks generated.`);
    return {
      success: true,
      status: 'ready',
      word_count: wordCount,
      content,
      chunksCount: chunks.length,
    };
  } catch (err) {
    console.error(`[KnowledgeProcessor] Processing error for document ${docId}:`, err.message);

    await db.query(
      `UPDATE knowledge_base_docs 
       SET status = 'failed',
           processing_error = $1,
           updated_at = NOW()
       WHERE id = $2 AND business_id = $3`,
      [err.message || 'Unable to process this document.', docId, businessId]
    );

    return {
      success: false,
      status: 'failed',
      error: err.message,
      processing_error: err.message,
      chunksCount: 0,
    };
  }
}

/**
 * Retry processing an existing failed document
 */
async function retryDocument(arg1, arg2) {
  let docId, businessId;
  if (typeof arg1 === 'object' && arg1 !== null) {
    docId = arg1.docId;
    businessId = arg1.businessId;
  } else {
    docId = arg1;
    businessId = arg2;
  }

  const result = await db.query(
    `SELECT id, name, original_filename, file_path, file_type, source_type, status 
     FROM knowledge_base_docs 
     WHERE id = $1 AND business_id = $2`,
    [docId, businessId]
  );

  if (result.rows.length === 0) {
    throw new Error('Document not found or access denied.');
  }

  const doc = result.rows[0];
  if (doc.source_type === 'text') {
    // For pure text sources that failed, mark ready
    await db.query(
      `UPDATE knowledge_base_docs SET status = 'ready', processing_error = NULL, updated_at = NOW() WHERE id = $1`,
      [docId]
    );
    await syncAssistantKnowledge(businessId);
    return { success: true, status: 'ready' };
  }

  if (!doc.file_path) {
    throw new Error('This document does not have an associated stored file to re-process.');
  }

  const buffer = await downloadFromStorage(doc.file_path);
  const ext = path.extname(doc.original_filename || doc.name).toLowerCase();

  return await processDocument(docId, businessId, buffer, doc.original_filename || doc.name, ext);
}

/**
 * Search knowledge chunks with full text search ts_rank and provenance
 */
async function searchKnowledgeChunks({ businessId, query, limit = 5 }) {
  if (!query || !query.trim() || !businessId) return [];

  const sql = `
    SELECT 
      c.id AS chunk_id,
      c.doc_id,
      c.content AS chunk_text,
      c.chunk_index,
      c.metadata,
      d.name AS doc_name,
      d.original_filename,
      d.file_type,
      ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', $1)) AS rank
    FROM knowledge_chunks c
    JOIN knowledge_base_docs d ON d.id = c.doc_id
    WHERE c.business_id = $2
      AND d.status = 'ready'
      AND (
        to_tsvector('english', c.content) @@ plainto_tsquery('english', $1)
        OR c.content ILIKE $3
      )
    ORDER BY rank DESC, c.chunk_index ASC
    LIMIT $4
  `;

  const wildCard = `%${query.trim()}%`;
  const result = await db.query(sql, [query.trim(), businessId, wildCard, limit]);
  return result.rows;
}

module.exports = {
  validateKnowledgeFile,
  uploadToStorage,
  deleteFromStorage,
  downloadFromStorage,
  extractDocumentContent,
  chunkDocumentText,
  processDocument,
  retryDocument,
  searchKnowledgeChunks,
  syncAssistantKnowledge,
  KNOWLEDGE_BUCKET,
  MAX_FILE_SIZE,
  SUPPORTED_EXTENSIONS,
};

