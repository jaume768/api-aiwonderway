const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const bodyParser = require('body-parser');

router.post('/webhook', bodyParser.raw({ type: 'application/json' }), paymentController.stripeWebhook);

router.post('/update-subscription', authMiddleware, paymentController.updateSubscription);
router.post('/add-credits', authMiddleware, paymentController.addCredits);
router.get('/subscription-status', authMiddleware, paymentController.getSubscriptionStatus);
router.get('/payment-history', authMiddleware, paymentController.getPaymentHistory);
router.post('/create-subscription-session', authMiddleware, paymentController.createSubscriptionSession);

module.exports = router;