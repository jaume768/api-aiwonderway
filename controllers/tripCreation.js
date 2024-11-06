const Trip = require('../models/Trip');
const User = require('../models/User');
const fetchCivitatisActivities = require('../utils/fetchCivitatisActivities');
const getTopCities = require('../utils/getTopCities');
const generateItinerary = require('../utils/generateItinerary');

exports.createTrip = async (req, res) => {
    try {
        const {
            title,
            description,
            public: isPublic,
            travelDates,
            destinationPreferences,
            budget,
            interests,
            accommodationPreferences,
            transportPreferences,
            foodPreferences,
            travelCompanion,
            activityLevel,
            additionalPreferences,
            numberOfCities
        } = req.body;

        const userId = req.userId;

        const requiredFields = [
            'travelDates',
            'travelDates.startDate',
            'travelDates.endDate',
            'destinationPreferences',
            'destinationPreferences.country',
            'budget',
            'budget.total',
            'accommodationPreferences',
            'accommodationPreferences.type',
            'transportPreferences',
            'transportPreferences.preferredMode',
            'travelCompanion',
            'travelCompanion.type',
            'activityLevel',
            'activityLevel.pace'
        ];

        for (const field of requiredFields) {
            const fieldParts = field.split('.');
            let value = req.body;
            for (const part of fieldParts) {
                value = value ? value[part] : undefined;
            }
            if (value === undefined || value === null) {
                return res.status(400).json({ msg: `El campo "${field}" es requerido.` });
            }
        }

        const numCities = Number(numberOfCities) || 3;
        if (numCities < 0) {
            return res.status(400).json({ msg: 'El número de ciudades debe ser minimo una.' });
        }

        const country = destinationPreferences.country;
        const topCities = await getTopCities(country, numCities);

        const activitiesPerCity = {};

        for (const city of topCities) {
            try {
                const activities = await fetchCivitatisActivities(city,5);
                activitiesPerCity[city] = activities;
            } catch (activityError) {
                console.error(`Error al obtener actividades para la ciudad "${city}":`, activityError.message);
                activitiesPerCity[city] = [];
            }
        }

        const userData = {
            travelDates,
            destinationPreferences,
            budget,
            interests,
            accommodationPreferences,
            transportPreferences,
            foodPreferences,
            travelCompanion,
            activityLevel,
            additionalPreferences,
            description,
            activitiesPerCity
        };

        const itinerary = await generateItinerary(userData);

        const trip = new Trip({
            createdBy: userId,
            title,
            description,
            itinerary,
            public: isPublic,
            travelDates,
            destinationPreferences,
            budget,
            interests,
            accommodationPreferences,
            transportPreferences,
            foodPreferences,
            travelCompanion,
            activityLevel,
            additionalPreferences,
        });

        await trip.save();

        const user = await User.findById(userId);
        user.trips.push(trip._id);
        await user.save();

        res.json(trip);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};
