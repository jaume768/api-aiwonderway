const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const authMiddleware = require('../middleware/authMiddleware');

// Crear viaje
router.post('/', authMiddleware, tripController.createTrip);

router.get('/popular', tripController.getPopularTrips);

router.post('/search', tripController.searchTrips);

// Obtener viajes del usuario
router.get('/user', authMiddleware, tripController.getUserTrips);

// Obtener viajes por especificaciones
router.post('/specifications', authMiddleware, tripController.getTripsBySpecifications);

module.exports = router;