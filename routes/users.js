const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Enviar solicitud de amistad
router.post('/add-friend', authMiddleware, userController.addFriend);

// Aceptar solicitud de amistad
router.post('/accept-friend', authMiddleware, userController.acceptFriendRequest);

// Obtener viajes de un amigo
router.get('/:friendId/trips', authMiddleware, userController.getFriendTrips);

router.get('/friend-requests', authMiddleware, userController.getFriendRequests);

module.exports = router;