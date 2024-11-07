const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/add-friend', authMiddleware, userController.addFriend);
router.post('/accept-friend', authMiddleware, userController.acceptFriendRequest);
router.get('/:friendId/trips', authMiddleware, userController.getFriendTrips);
router.get('/friend-requests', authMiddleware, userController.getFriendRequests);
router.post('/favorites/add', authMiddleware, userController.addFavoriteTrip);
router.post('/favorites/remove', authMiddleware, userController.removeFavoriteTrip);
router.get('/favorites', authMiddleware, userController.getFavoriteTrips);

module.exports = router;