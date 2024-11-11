const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/update-subscription', authMiddleware, paymentController.updateSubscription);

router.post('/add-credits', authMiddleware, paymentController.addCredits);

router.get('/subscription-status', authMiddleware, paymentController.getSubscriptionStatus);

router.get('/payment-history', authMiddleware, paymentController.getPaymentHistory);

module.exports = router;