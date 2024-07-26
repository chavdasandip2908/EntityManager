const express = require('express');
const { createCollection, getCollections, getCollectionById, updateCollection, deleteCollection } = require('../controllers/collectionController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/collections',authenticate,  createCollection);
router.get('/collections',authenticate,  getCollections);
router.get('/collections/:id',authenticate,  getCollectionById);
router.put('/collections/:id',authenticate,  updateCollection);
router.delete('/collections/:id',authenticate,  deleteCollection);

module.exports = router;
