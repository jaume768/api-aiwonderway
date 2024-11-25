const express = require('express');
const router = express.Router();

const tripController = require('../controllers/tripController');
const tripCreation = require('../controllers/tripCreation');

const authMiddleware = require('../middleware/authMiddleware');

router.get('/user', authMiddleware, tripController.getUserTrips);
router.post('/create', authMiddleware, tripCreation.createTrip);
router.put('/:tripId', authMiddleware, tripController.updateTrip);
router.delete('/:tripId', authMiddleware, tripController.deleteTrip);

router.get('/popular', tripController.getPopularTrips);
router.post('/search', tripController.searchTrips);
router.get('/civitatis-actividades/:city', tripController.getCivitatisActivities);

router.post('/specifications', authMiddleware, tripController.getTripsBySpecifications);

router.post('/share', authMiddleware, tripController.shareTrip);
router.post('/remove-collaborator', authMiddleware, tripController.removeCollaborator);


router.get('/download/:tripId', authMiddleware, tripController.downloadTrip);
router.get('/:tripId', authMiddleware, tripController.getTripById);

module.exports = router;