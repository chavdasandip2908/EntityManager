const express = require('express');
const { createItem, getItems, getItemById, updateItem, deleteItem } = require('../controllers/itemController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/items', authenticate, createItem);
router.get('/items', authenticate, getItems);
router.get('/items/:id', authenticate, getItemById);
router.put('/items/:id', authenticate, updateItem);
router.delete('/items/:id', authenticate, deleteItem);

module.exports = router;
