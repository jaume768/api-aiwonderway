const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/dashboard',authMiddleware,roleMiddleware('admin'),adminController.getDashboard);

router.get('/users',authMiddleware,roleMiddleware('admin'),adminController.getAllUsers);
router.get('/users/:userId',authMiddleware,roleMiddleware('admin'),adminController.getUserById);
router.put('/users/:userId',authMiddleware,roleMiddleware('admin'),adminController.updateUser);

router.delete('/users/:userId',authMiddleware,roleMiddleware('admin'),adminController.deleteUser);

// Rutas para gestión de reseñas
router.get('/users/:userId/reviews',authMiddleware,roleMiddleware('admin'),adminController.getUserReviews);
router.put('/reviews/:reviewId',authMiddleware,roleMiddleware('admin'),adminController.updateReview);

router.delete('/reviews/:reviewId',authMiddleware,roleMiddleware('admin'),adminController.deleteReview);
router.get('/users/:userId/comments',authMiddleware,roleMiddleware('admin'),adminController.getUserComments);
router.put('/comments/:commentId',authMiddleware,roleMiddleware('admin'),adminController.updateComment);
router.delete('/comments/:commentId',authMiddleware,roleMiddleware('admin'),adminController.deleteComment);

// Rutas para ver itinerarios de un usuario
router.get('/users/:userId/trips',authMiddleware,roleMiddleware('admin'),adminController.getUserTrips);

// Rutas para gestión de hoteles
router.get('/hotels',authMiddleware,roleMiddleware('admin'),adminController.getAllHotels);
router.put('/hotels/:hotelId',authMiddleware,roleMiddleware('admin'),adminController.updateHotel);
router.delete('/hotels/:hotelId',authMiddleware,roleMiddleware('admin'),adminController.deleteHotel);

module.exports = router;
