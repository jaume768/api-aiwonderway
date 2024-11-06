const express = require('express');
const router = express.Router();

const tripController = require('../controllers/tripController');
const tripCreation = require('../controllers/tripCreation');

const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, tripCreation.createTrip);

router.get('/popular', tripController.getPopularTrips);
router.post('/search', tripController.searchTrips);
router.get('/civitatis-actividades/:city', tripController.getCivitatisActivities);

router.get('/user', authMiddleware, tripController.getUserTrips);

router.post('/specifications', authMiddleware, tripController.getTripsBySpecifications);

module.exports = router;