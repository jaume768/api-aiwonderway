const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadProfilePicture');

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);1
router.get('/:userId/public-profile', userController.getPublicProfile);

// Perfil
router.post('/upload-profile-picture', authMiddleware, upload.single('image'), userController.uploadProfilePicture);

// Amigos
router.post('/add-friend', authMiddleware, userController.addFriend);
router.post('/accept-friend', authMiddleware, userController.acceptFriendRequest);
router.get('/:friendId/trips', authMiddleware, userController.getFriendTrips);
router.get('/friend-requests', authMiddleware, userController.getFriendRequests);
router.post('/cancel-friend-request', authMiddleware, userController.cancelFriendRequest);
router.get('/friends', authMiddleware, userController.getFriends);

// Favoritos
router.post('/favorites/add', authMiddleware, userController.addFavoriteTrip);
router.post('/favorites/remove', authMiddleware, userController.removeFavoriteTrip);
router.get('/favorites', authMiddleware, userController.getFavoriteTrips);

// Listas personalizadas de los viajes
router.post('/custom-lists/create', authMiddleware, userController.createCustomList);
router.post('/custom-lists/add-trip', authMiddleware, userController.addTripToCustomList);
router.post('/custom-lists/remove-trip', authMiddleware, userController.removeTripFromCustomList);
router.post('/custom-lists/delete', authMiddleware, userController.deleteCustomList);
router.get('/custom-lists', authMiddleware, userController.getCustomLists);
router.post('/custom-lists/edit-name', authMiddleware, userController.editCustomListName);

// Cargar intinerarios recomendados
router.get('/recomendations', authMiddleware, userController.getRecommendations);

module.exports = router;