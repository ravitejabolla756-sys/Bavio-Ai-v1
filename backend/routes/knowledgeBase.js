const express = require('express');
const router = express.Router();
const multer = require('multer');
const kbController = require('../controllers/knowledgeBaseController');
const { requireAuth } = require('../middleware/auth');

// Multer memory storage with 25MB file size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file
    files: 10,
  },
});

// Middleware wrapper to catch Multer errors cleanly
function handleUploadMiddleware(req, res, next) {
  // Support both 'files' array and single 'file'
  upload.fields([{ name: 'files', maxCount: 10 }, { name: 'file', maxCount: 1 }])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File size exceeds maximum limit of 25MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ success: false, error: 'Too many files. Maximum is 10 files per upload.' });
      }
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message || 'File upload failed.' });
    }

    // Normalize req.files to array
    if (req.files) {
      const allFiles = [];
      if (Array.isArray(req.files.files)) allFiles.push(...req.files.files);
      if (Array.isArray(req.files.file)) allFiles.push(...req.files.file);
      req.files = allFiles;
    }
    next();
  });
}

// All routes require authentication
router.get('/search', requireAuth, kbController.searchDocs);        // GET  /knowledge-base/search?q=
router.post('/sync-vapi', requireAuth, kbController.syncToVapi);    // POST /knowledge-base/sync-vapi
router.post('/sync', requireAuth, kbController.syncToVapi);         // POST /knowledge-base/sync

// File Uploads
router.post('/upload', requireAuth, handleUploadMiddleware, kbController.uploadFiles);

// Clean REST API aliases matching spec (/knowledge-base/sources, /knowledge/sources, etc.)
router.get('/sources', requireAuth, kbController.listDocs);
router.post('/sources', requireAuth, (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return handleUploadMiddleware(req, res, () => kbController.uploadFiles(req, res));
  }
  return kbController.createDoc(req, res);
});
router.get('/sources/:id', requireAuth, kbController.getDoc);
router.post('/sources/:id/retry', requireAuth, kbController.retryDoc);
router.delete('/sources/:id', requireAuth, kbController.deleteDoc);

// Direct document operations
router.get('/', requireAuth, kbController.listDocs);                // GET  /knowledge-base/
router.post('/', requireAuth, kbController.createDoc);              // POST /knowledge-base/
router.post('/:id/retry', requireAuth, kbController.retryDoc);      // POST /knowledge-base/:id/retry
router.post('/:id/summarize', requireAuth, kbController.summarizeDoc);
router.get('/:id', requireAuth, kbController.getDoc);
router.patch('/:id', requireAuth, kbController.updateDoc);
router.delete('/:id', requireAuth, kbController.deleteDoc);         // DELETE /knowledge-base/:id

module.exports = router;

