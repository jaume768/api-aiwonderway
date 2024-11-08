const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/trips/:tripId/reviews',authMiddleware,reviewController.createReview);

router.get('/trips/:tripId/reviews', reviewController.getReviewsForTrip);

module.exports = router;