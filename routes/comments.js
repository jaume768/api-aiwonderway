const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/trips/:tripId/comments',authMiddleware,commentController.createComment);

router.get('/trips/:tripId/comments', commentController.getCommentsForTrip);

module.exports = router;