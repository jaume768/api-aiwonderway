const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/trips/:tripId/comments', authMiddleware, commentController.createComment);

router.get('/trips/:tripId/comments', commentController.getCommentsForTrip);

router.put('/comments/:commentId', authMiddleware, commentController.updateComment);

router.delete('/comments/:commentId', authMiddleware, commentController.deleteComment);

module.exports = router;