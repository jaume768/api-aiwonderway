const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/dashboard',authMiddleware,roleMiddleware('admin'),adminController.getDashboard);

router.get('/users',authMiddleware,roleMiddleware('admin'),adminController.getAllUsers);

router.delete('/users/:userId',authMiddleware,roleMiddleware('admin'),adminController.deleteUser);


module.exports = router;
