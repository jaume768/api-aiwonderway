const Trip = require('../models/Trip');
const User = require('../models/User');
const fetchCivitatisActivities = require('../utils/fetchCivitatisActivities');
const actualizarHotelesConSitiosWeb = require('../utils/fetchAmadeusHotels');
const getTopCities = require('../utils/getTopCities');
const generateItinerary = require('../utils/generateItinerary');
const moment = require('moment');
const generateTripPDF = require('../utils/generatePDF');
const jwt = require('jsonwebtoken');
const { cloudinary, storage } = require('../utils/cloudinary');
const fs = require('fs');

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
            'destinationPreferences.countryName',
            'destinationPreferences.type',
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
            if (value === undefined || value === null || value === '') {
                return res.status(400).json({ msg: `El campo "${field}" es requerido.` });
            }
        }

        const numCities = Number(numberOfCities) || 3;
        if (numCities < 1) {
            return res.status(400).json({ msg: 'El número de ciudades debe ser al menos una.' });
        }

        const country = destinationPreferences.countryName;
        const topCities = await getTopCities(country, numCities);

        const activitiesPerCity = {};
        const hotelsPerCity = {};

        for (const cityObj of topCities) {
            const citySpanish = cityObj.spanish;
            const cityCode = cityObj.english;
        
            try {
                const activities = await fetchCivitatisActivities(citySpanish, 5);
                activitiesPerCity[citySpanish] = activities;
            } catch (activityError) {
                console.error(`Error al obtener actividades para la ciudad "${citySpanish}":`, activityError.message);
                activitiesPerCity[citySpanish] = [];
            }
        
            try {
                const hotels = await actualizarHotelesConSitiosWeb(cityCode, 3);
                hotelsPerCity[citySpanish] = hotels;
            } catch (hotelError) {
                console.error(`Error al obtener hoteles para la ciudad con código IATA "${cityCode}":`, hotelError.message);
                hotelsPerCity[citySpanish] = [];
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
            activitiesPerCity,
            hotelsPerCity
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
            activitiesPerCity,
            hotelsPerCity
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
