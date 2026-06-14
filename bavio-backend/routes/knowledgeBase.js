const express = require('express');
const router = express.Router();
const kbController = require('../controllers/knowledgeBaseController');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.get('/search', requireAuth, kbController.searchDocs);      // GET /knowledge-base/search?q=
router.get('/', requireAuth, kbController.listDocs);              // GET /knowledge-base/
router.post('/', requireAuth, kbController.createDoc);            // POST /knowledge-base/
router.delete('/:id', requireAuth, kbController.deleteDoc);       // DELETE /knowledge-base/:id

module.exports = router;
