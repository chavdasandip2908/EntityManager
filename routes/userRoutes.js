const express = require('express');
const { createUser, loginUser, getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.post('/users', createUser);
router.post('/users/login', loginUser);
router.get('/users', authenticate, getUsers);
router.get('/users/:id', authenticate, getUserById);
router.put('/users/:id', authenticate, updateUser);
router.delete('/users/:id',authenticate, deleteUser);

module.exports = router;
