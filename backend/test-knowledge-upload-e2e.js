require('dotenv').config();
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const db = require('./database/db');
const knowledgeProcessor = require('./services/knowledgeProcessor');
const XLSX = require('xlsx');

// Minimal valid XLSX generator
function createTestXlsxBuffer() {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['Product', 'Tier', 'Price', 'Description'],
    ['Bavio Starter', 'Basic', '$49/mo', 'Includes 200 calling minutes and 1 phone number'],
    ['Bavio Growth', 'Pro', '$149/mo', 'Includes 1000 calling minutes, 3 phone numbers, and custom voices'],
    ['Bavio Enterprise', 'Custom', '$499/mo', 'Dedicated SIP trunk, unlimited concurrency, and SLA guarantees']
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'PricingTiers');

  const wsFaq = [
    ['Topic', 'Details'],
    ['Refund Policy', 'Full refund within 30 days of subscription start date with zero penalties'],
    ['Support Hours', 'Support is operational 24/7 across US and India time zones']
  ];
  const wsFaqSheet = XLSX.utils.aoa_to_sheet(wsFaq);
  XLSX.utils.book_append_sheet(wb, wsFaqSheet, 'FAQ');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// Minimal valid CSV generator
function createTestCsvBuffer() {
  const csv = `Question,Answer,Category
What are your office hours?,Our office is open from 8:00 AM to 6:00 PM EST Monday through Friday.,Hours
Do you provide on-site setup?,Yes we offer remote and on-site integration for enterprise plans.,Services
Where is headquarters located?,Bavio is headquartered in Bangalore with operations in Delaware.,Locations`;
  return Buffer.from(csv, 'utf8');
}

// Minimal 1x1 transparent PNG buffer
function createTestPngBuffer() {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);
}

async function runE2ETests() {
  console.log('====================================================');
  console.log('BAVIO KNOWLEDGE PIPELINE — PRODUCTION E2E SUITE');
  console.log('====================================================\n');

  // Find a valid business ID or create test business
  await new Promise(r => setTimeout(r, 2500)); // Let migrations settle
  const bRes = await db.query('SELECT id FROM businesses LIMIT 1');
  if (!bRes.rows.length) {
    throw new Error('No businesses found in database to test against.');
  }
  const businessId = bRes.rows[0].id;
  console.log(`[Test] Using businessId: ${businessId}`);

  let testDocIds = [];

  try {
    // ----------------------------------------------------
    // TEST 1: PDF Extraction, Chunking & Storage
    // ----------------------------------------------------
    console.log('\n--- TEST 1: Real PDF Upload & Processing ---');
    const pdfPath = path.join(__dirname, 'node_modules/pdf-parse/test/data/01-valid.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);

    const pdfValidation = knowledgeProcessor.validateKnowledgeFile({
      originalname: 'research-paper.pdf',
      size: pdfBuffer.length,
      mimetype: 'application/pdf',
      buffer: pdfBuffer,
    });
    assert.strictEqual(pdfValidation.valid, true, 'PDF validation must pass');

    // Insert doc in DB
    const pdfDocRes = await db.query(
      `INSERT INTO knowledge_base_docs (business_id, name, original_filename, file_type, file_size, source_type, status, metadata)
       VALUES ($1, $2, $3, $4, $5, 'file', 'uploading', $6)
       RETURNING id`,
      [businessId, 'Research Paper PDF', 'research-paper.pdf', 'pdf', pdfBuffer.length, JSON.stringify({ e2e: true })]
    );
    const pdfDocId = pdfDocRes.rows[0].id;
    testDocIds.push(pdfDocId);

    // Upload to real Supabase Storage
    const uploadedPdfPath = await knowledgeProcessor.uploadToStorage(
      pdfBuffer,
      businessId,
      pdfDocId,
      'research-paper.pdf',
      'application/pdf'
    );
    await db.query('UPDATE knowledge_base_docs SET file_path = $1 WHERE id = $2', [uploadedPdfPath, pdfDocId]);

    // Process document
    const pdfProcessed = await knowledgeProcessor.processDocument({
      docId: pdfDocId,
      businessId,
      buffer: pdfBuffer,
      filename: 'research-paper.pdf',
      fileType: 'pdf',
      mimetype: 'application/pdf',
    });

    console.log(`[Test 1] Status: ${pdfProcessed.status}, Word count: ${pdfProcessed.word_count}, Chunks: ${pdfProcessed.chunksCount}`);
    assert.strictEqual(pdfProcessed.status, 'ready', 'PDF processing status must be ready');
    assert.ok(pdfProcessed.content.length > 50, 'PDF extracted content must be non-empty');

    // Verify chunks in DB
    const pdfChunksRes = await db.query('SELECT * FROM knowledge_chunks WHERE doc_id = $1', [pdfDocId]);
    console.log(`[Test 1] DB Chunks verified: ${pdfChunksRes.rows.length}`);
    assert.ok(pdfChunksRes.rows.length >= 1, 'At least 1 chunk must be created for PDF');
    assert.strictEqual(pdfChunksRes.rows[0].business_id, businessId, 'Chunk must preserve business_id');

    // ----------------------------------------------------
    // TEST 2: Real DOCX Document Extraction & Chunking
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Real DOCX Upload & Processing ---');
    const docxPath = path.join(__dirname, 'node_modules/mammoth/test/test-data/tables.docx');
    const docxBuffer = fs.readFileSync(docxPath);

    const docxDocRes = await db.query(
      `INSERT INTO knowledge_base_docs (business_id, name, original_filename, file_type, file_size, source_type, status, metadata)
       VALUES ($1, $2, $3, $4, $5, 'file', 'uploading', $6)
       RETURNING id`,
      [businessId, 'Corporate Tables DOCX', 'tables.docx', 'docx', docxBuffer.length, JSON.stringify({ e2e: true })]
    );
    const docxDocId = docxDocRes.rows[0].id;
    testDocIds.push(docxDocId);

    const docxProcessed = await knowledgeProcessor.processDocument({
      docId: docxDocId,
      businessId,
      buffer: docxBuffer,
      filename: 'tables.docx',
      fileType: 'docx',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    console.log(`[Test 2] Status: ${docxProcessed.status}, Word count: ${docxProcessed.word_count}`);
    assert.strictEqual(docxProcessed.status, 'ready', 'DOCX processing must be ready');
    assert.ok(docxProcessed.content.length > 10, 'DOCX content must be extracted');

    const docxChunksRes = await db.query('SELECT * FROM knowledge_chunks WHERE doc_id = $1', [docxDocId]);
    console.log(`[Test 2] DB Chunks verified: ${docxChunksRes.rows.length}`);
    assert.ok(docxChunksRes.rows.length >= 1, 'DOCX must produce chunks');

    // ----------------------------------------------------
    // TEST 3: XLSX Multi-Sheet Extraction & Chunking
    // ----------------------------------------------------
    console.log('\n--- TEST 3: XLSX Multi-Sheet Upload & Processing ---');
    const xlsxBuffer = createTestXlsxBuffer();
    const xlsxValidation = knowledgeProcessor.validateKnowledgeFile({
      originalname: 'pricing-and-faq.xlsx',
      size: xlsxBuffer.length,
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: xlsxBuffer,
    });
    assert.strictEqual(xlsxValidation.valid, true, 'XLSX validation must pass');

    const xlsxDocRes = await db.query(
      `INSERT INTO knowledge_base_docs (business_id, name, original_filename, file_type, file_size, source_type, status, metadata)
       VALUES ($1, $2, $3, $4, $5, 'file', 'uploading', $6)
       RETURNING id`,
      [businessId, 'Pricing and FAQ', 'pricing-and-faq.xlsx', 'xlsx', xlsxBuffer.length, JSON.stringify({ e2e: true })]
    );
    const xlsxDocId = xlsxDocRes.rows[0].id;
    testDocIds.push(xlsxDocId);

    const xlsxProcessed = await knowledgeProcessor.processDocument({
      docId: xlsxDocId,
      businessId,
      buffer: xlsxBuffer,
      filename: 'pricing-and-faq.xlsx',
      fileType: 'xlsx',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    console.log(`[Test 3] Status: ${xlsxProcessed.status}, Word count: ${xlsxProcessed.word_count}`);
    assert.strictEqual(xlsxProcessed.status, 'ready', 'XLSX processing must be ready');
    assert.ok(xlsxProcessed.content.includes('Bavio Starter'), 'XLSX extraction must contain Pricing sheet rows');
    assert.ok(xlsxProcessed.content.includes('Refund Policy'), 'XLSX extraction must contain FAQ sheet rows');

    const xlsxChunksRes = await db.query('SELECT * FROM knowledge_chunks WHERE doc_id = $1', [xlsxDocId]);
    console.log(`[Test 3] DB Chunks verified: ${xlsxChunksRes.rows.length}`);
    assert.ok(xlsxChunksRes.rows.length >= 1, 'XLSX must have created chunks');

    // ----------------------------------------------------
    // TEST 4: CSV Extraction & Chunking
    // ----------------------------------------------------
    console.log('\n--- TEST 4: CSV Upload & Processing ---');
    const csvBuffer = createTestCsvBuffer();
    const csvDocRes = await db.query(
      `INSERT INTO knowledge_base_docs (business_id, name, original_filename, file_type, file_size, source_type, status, metadata)
       VALUES ($1, $2, $3, $4, $5, 'file', 'uploading', $6)
       RETURNING id`,
      [businessId, 'Operating Hours CSV', 'hours.csv', 'csv', csvBuffer.length, JSON.stringify({ e2e: true })]
    );
    const csvDocId = csvDocRes.rows[0].id;
    testDocIds.push(csvDocId);

    const csvProcessed = await knowledgeProcessor.processDocument({
      docId: csvDocId,
      businessId,
      buffer: csvBuffer,
      filename: 'hours.csv',
      fileType: 'csv',
      mimetype: 'text/csv',
    });

    console.log(`[Test 4] Status: ${csvProcessed.status}`);
    assert.strictEqual(csvProcessed.status, 'ready', 'CSV status must be ready');
    assert.ok(csvProcessed.content.includes('8:00 AM to 6:00 PM'), 'CSV content must contain extracted hours');

    // ----------------------------------------------------
    // TEST 5: Image Handling (No fake OCR, graceful failure)
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Image Upload Handling ---');
    const pngBuffer = createTestPngBuffer();
    const pngDocRes = await db.query(
      `INSERT INTO knowledge_base_docs (business_id, name, original_filename, file_type, file_size, source_type, status, metadata)
       VALUES ($1, $2, $3, $4, $5, 'file', 'uploading', $6)
       RETURNING id`,
      [businessId, 'Storefront Image', 'storefront.png', 'png', pngBuffer.length, JSON.stringify({ e2e: true })]
    );
    const pngDocId = pngDocRes.rows[0].id;
    testDocIds.push(pngDocId);

    const pngProcessed = await knowledgeProcessor.processDocument({
      docId: pngDocId,
      businessId,
      buffer: pngBuffer,
      filename: 'storefront.png',
      fileType: 'png',
      mimetype: 'image/png',
    });

    console.log(`[Test 5] Status: ${pngProcessed.status}, Error: ${pngProcessed.processing_error}`);
    assert.strictEqual(pngProcessed.status, 'failed', 'Image without approved OCR provider must fail gracefully');
    assert.ok(pngProcessed.processing_error.includes('OCR'), 'Error must accurately state OCR is disabled');

    // ----------------------------------------------------
    // TEST 6: Malformed / Corrupt Document Handling
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Corrupt Document Handling ---');
    const corruptPath = path.join(__dirname, 'node_modules/pdf-parse/test/data/03-invalid.pdf');
    const corruptBuffer = fs.readFileSync(corruptPath);

    const corruptDocRes = await db.query(
      `INSERT INTO knowledge_base_docs (business_id, name, original_filename, file_type, file_size, source_type, status, metadata)
       VALUES ($1, $2, $3, $4, $5, 'file', 'uploading', $6)
       RETURNING id`,
      [businessId, 'Corrupt PDF', '03-invalid.pdf', 'pdf', corruptBuffer.length, JSON.stringify({ e2e: true })]
    );
    const corruptDocId = corruptDocRes.rows[0].id;
    testDocIds.push(corruptDocId);

    const corruptProcessed = await knowledgeProcessor.processDocument({
      docId: corruptDocId,
      businessId,
      buffer: corruptBuffer,
      filename: '03-invalid.pdf',
      fileType: 'pdf',
      mimetype: 'application/pdf',
    });

    console.log(`[Test 6] Status: ${corruptProcessed.status}, Error: ${corruptProcessed.processing_error}`);
    assert.strictEqual(corruptProcessed.status, 'failed', 'Corrupt document must be marked as failed');
    assert.ok(corruptProcessed.processing_error.includes('could not be read') || corruptProcessed.processing_error.includes('corrupt'), 'Error message must reflect corruption');

    // ----------------------------------------------------
    // TEST 7: Unsupported File Extension & Oversized File
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Unsupported File & Oversized Validation ---');
    let invalidCaught = false;
    try {
      knowledgeProcessor.validateKnowledgeFile({
        originalname: 'exploit.exe',
        size: 500,
        mimetype: 'application/x-msdownload',
        buffer: Buffer.from('hello'),
      });
    } catch (e) {
      invalidCaught = true;
      console.log(`[Test 7] Invalid ext error caught: ${e.message}`);
    }
    assert.strictEqual(invalidCaught, true, 'exe extension must be rejected');

    let oversizedCaught = false;
    try {
      knowledgeProcessor.validateKnowledgeFile({
        originalname: 'huge.pdf',
        size: 30 * 1024 * 1024,
        mimetype: 'application/pdf',
        buffer: Buffer.alloc(10),
      });
    } catch (e) {
      oversizedCaught = true;
      console.log(`[Test 7] Oversized error caught: ${e.message}`);
    }
    assert.strictEqual(oversizedCaught, true, '30MB file must be rejected');

    // ----------------------------------------------------
    // TEST 8: Search Retrieval with Chunk Provenance
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Search Retrieval & Provenance ---');
    const searchMatches = await knowledgeProcessor.searchKnowledgeChunks({
      businessId,
      query: 'Bavio Starter calling minutes',
      limit: 5,
    });
    console.log(`[Test 8] Found ${searchMatches.length} search matches for "Bavio Starter calling minutes"`);
    assert.ok(searchMatches.length >= 1, 'Search query must find matching chunks');
    console.log(`[Test 8] Top result source: ${searchMatches[0].doc_name}, snippet: "${searchMatches[0].chunk_text.slice(0, 60)}..."`);
    assert.strictEqual(searchMatches[0].doc_id, xlsxDocId, 'Top match must be the pricing xlsx document');

    // ----------------------------------------------------
    // TEST 9: Idempotent Retry of a Document
    // ----------------------------------------------------
    console.log('\n--- TEST 9: Idempotent Retry from Storage ---');
    const retryResult = await knowledgeProcessor.retryDocument({
      docId: pdfDocId,
      businessId,
    });
    console.log(`[Test 9] Retry status: ${retryResult.status}`);
    assert.strictEqual(retryResult.status, 'ready', 'Retry must succeed');
    // Ensure chunks count remains exactly the same, no duplicate chunks created
    const retryChunks = await db.query('SELECT COUNT(*) FROM knowledge_chunks WHERE doc_id = $1', [pdfDocId]);
    console.log(`[Test 9] Chunks after retry: ${retryChunks.rows[0].count}`);
    assert.strictEqual(Number(retryChunks.rows[0].count), pdfChunksRes.rows.length, 'Retry must not duplicate chunks');

    // ----------------------------------------------------
    // TEST 10: Assistant Integration & System Prompt Sync
    // ----------------------------------------------------
    console.log('\n--- TEST 10: Agent Assistant System Prompt Sync ---');
    const astRes = await db.query('SELECT id, system_prompt FROM assistants WHERE business_id = $1 LIMIT 1', [businessId]);
    if (astRes.rows.length > 0) {
      const ast = astRes.rows[0];
      await knowledgeProcessor.syncAssistantKnowledge(businessId);
      const updatedAst = await db.query('SELECT system_prompt FROM assistants WHERE id = $1', [ast.id]);
      const prompt = updatedAst.rows[0].system_prompt || '';
      console.log(`[Test 10] Assistant prompt synced. Length: ${prompt.length}`);
      assert.ok(prompt.includes('=== BUSINESS KNOWLEDGE BASE ==='), 'System prompt must include Knowledge Base marker');
      assert.ok(prompt.includes('Pricing and FAQ'), 'System prompt must reference ready documents');
    } else {
      console.log('[Test 10] No assistant configured for this business; sync executed safely.');
    }

    // ----------------------------------------------------
    // TEST 11: Multi-tenancy Isolation
    // ----------------------------------------------------
    console.log('\n--- TEST 11: Multi-tenancy Isolation ---');
    const fakeOtherTenant = '00000000-0000-0000-0000-000000000099';
    const foreignSearch = await knowledgeProcessor.searchKnowledgeChunks({
      businessId: fakeOtherTenant,
      query: 'Bavio Starter',
      limit: 5,
    });
    console.log(`[Test 11] Foreign tenant search results: ${foreignSearch.length}`);
    assert.strictEqual(foreignSearch.length, 0, 'Foreign tenant must NOT see chunks from another tenant');

    // ----------------------------------------------------
    // TEST 12: Clean Document Deletion (DB, Chunks, Storage)
    // ----------------------------------------------------
    console.log('\n--- TEST 12: Document Deletion ---');
    const docToDelete = testDocIds.pop();
    const docInfo = await db.query('SELECT file_path FROM knowledge_base_docs WHERE id = $1', [docToDelete]);
    const deleteFilePath = docInfo.rows[0]?.file_path;

    // Delete chunks
    await db.query('DELETE FROM knowledge_chunks WHERE doc_id = $1', [docToDelete]);
    // Delete doc
    await db.query('DELETE FROM knowledge_base_docs WHERE id = $1', [docToDelete]);
    // Delete from storage
    if (deleteFilePath) {
      await knowledgeProcessor.deleteFromStorage(deleteFilePath);
    }

    const checkChunks = await db.query('SELECT COUNT(*) FROM knowledge_chunks WHERE doc_id = $1', [docToDelete]);
    assert.strictEqual(Number(checkChunks.rows[0].count), 0, 'All chunks must be deleted');
    console.log(`[Test 12] Document and chunks successfully cleaned up.`);

    console.log('\n====================================================');
    console.log('ALL 12 E2E KNOWLEDGE PRODUCTION TESTS PASSED!');
    console.log('====================================================');
  } finally {
    // Clean up remaining test docs
    for (const id of testDocIds) {
      try {
        const row = await db.query('SELECT file_path FROM knowledge_base_docs WHERE id = $1', [id]);
        if (row.rows[0]?.file_path) {
          await knowledgeProcessor.deleteFromStorage(row.rows[0].file_path);
        }
        await db.query('DELETE FROM knowledge_chunks WHERE doc_id = $1', [id]);
        await db.query('DELETE FROM knowledge_base_docs WHERE id = $1', [id]);
      } catch (err) {
        // ignore cleanup error
      }
    }
  }
}

runE2ETests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\nE2E TEST FAILURE:', err);
    process.exit(1);
  });
