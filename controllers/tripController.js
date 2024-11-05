const Trip = require('../models/Trip');
const User = require('../models/User');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function fetchCivitatisActivities(city) {
    if (!city) {
        throw new Error('La ciudad es requerida como parámetro.');
    }

    const cityFormatted = city.toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.civitatis.com/es/${cityFormatted}/`;

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const activities = [];

        $('article.comfort-card').each((index, element) => {
            const title = $(element).find('h2.comfort-card__title').text().trim();
            const linkRelative = $(element).find('a._activity-link').attr('href');
            const link = linkRelative ? `https://www.civitatis.com${linkRelative}` : 'Enlace no disponible';
            const ratingRaw = $(element).find('span.m-rating--text').text().trim();
            const reviewsRaw = $(element).find('span.text--rating-total').text().trim();
            const priceElement = $(element).find('span.comfort-card__price__text');
            const price = priceElement.length > 0 ? priceElement.text().trim() : 'Gratis';

            const rating = ratingRaw
                ? ratingRaw.replace(/\s+/g, ' ').replace('/ 10', '').trim()
                : 'Sin calificación';
            const reviews = reviewsRaw
                ? reviewsRaw.replace(/\s+/g, ' ').replace('opiniones', '').trim()
                : '0';

            activities.push({
                title: title || 'Título no disponible',
                link: link,
                rating: rating,
                reviews: reviews,
                price: price
            });
        });

        const limitedActivities = activities.slice(0, 5);

        if (limitedActivities.length === 0) {
            throw new Error(`No se encontraron actividades para la ciudad "${city}".`);
        }

        return limitedActivities;
    } catch (error) {
        console.error(`Error al extraer actividades para la ciudad "${city}":`, error.message);
        if (error.response && error.response.status === 404) {
            throw new Error(`La ciudad "${city}" no existe en Civitatis.`);
        }
        throw new Error('Error al extraer las actividades de Civitatis.');
    }
}

exports.getCivitatisActivities = async (req, res) => {
    try {
        const { city } = req.params;

        const activities = await fetchCivitatisActivities(city);

        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

async function getTopCities(country) {
    const apiKey = process.env.OPENAI_API_KEY;

    const prompt = `
        Proporciona una lista en formato JSON de las 3 ciudades más importantes de ${country}. La respuesta debe ser únicamente un array JSON con los nombres de las ciudades.

        Ejemplo de formato:
        ["Ciudad1", "Ciudad2", "Ciudad3"]
    `;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "Eres un experto en geografía y turismo." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 100,
                temperature: 0.3,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
            }
        );

        let citiesText = response.data.choices[0].message.content.trim();

        if (citiesText.startsWith('[') && citiesText.endsWith(']')) {
        } else {
            const jsonMatch = citiesText.match(/\[.*\]/s);
            if (jsonMatch) {
                citiesText = jsonMatch[0];
            } else {
                throw new Error('No se pudo extraer el JSON de ciudades de la respuesta de OpenAI.');
            }
        }

        const cities = JSON.parse(citiesText);

        if (!Array.isArray(cities) || cities.length < 3) {
            throw new Error('La respuesta de OpenAI no contiene una lista válida de ciudades.');
        }

        return cities.slice(0, 3);
    } catch (error) {
        console.error('Error al obtener las ciudades desde OpenAI:', error.response ? error.response.data : error.message);
        throw new Error('No se pudo obtener las ciudades principales del país.');
    }
}

exports.createTrip = async (req, res) => {
    try {
        const {
            title,
            description,
            public,
            travelDates,
            destinationPreferences,
            budget,
            interests,
            accommodationPreferences,
            transportPreferences,
            foodPreferences,
            travelCompanion,
            activityLevel,
            additionalPreferences
        } = req.body;

        const userId = req.userId;

        const requiredFields = [
            'travelDates',
            'travelDates.startDate',
            'travelDates.endDate',
            'destinationPreferences',
            'destinationPreferences.type',
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

        const country = destinationPreferences.country;
        const topCities = await getTopCities(country);

        const activitiesPerCity = {};

        for (const city of topCities) {
            try {
                const activities = await fetchCivitatisActivities(city);
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
            public,
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

async function generateItinerary(userData) {
    const apiKey = process.env.OPENAI_API_KEY;

    let activitiesDescription = '';
    if (userData.activitiesPerCity && Object.keys(userData.activitiesPerCity).length > 0) {
        activitiesDescription += 'Aquí tienes algunas actividades recomendadas para las ciudades principales:\n';
        for (const [city, activities] of Object.entries(userData.activitiesPerCity)) {
            activitiesDescription += `\n**${city}:**\n`;
            activities.forEach((activity, index) => {
                activitiesDescription += `${index + 1}. ${activity.title} - ${activity.price}\n`;
            });
        }
    }

    const prompt = `
        Eres un asistente de planificación de viajes experto. Basándote en la información proporcionada, genera un itinerario detallado para el viaje. El itinerario debe estar organizado por días e incluir recomendaciones de actividades, lugares para visitar, opciones de alojamiento y transporte. La respuesta **debe ser únicamente** un objeto JSON con la siguiente estructura:

        {
            "dia1": {
                "fecha": "YYYY-MM-DD",
                "actividades": [
                    {
                        "hora": "HH:MM",
                        "actividad": "Descripción de la actividad",
                        "ubicación": "Lugar de la actividad"
                    }
                ],
                "acompañamiento": "Detalles sobre alojamiento y transporte si aplica"
            },
            "dia2": { ... },
            ...
        }

        **Información del usuario:**

        **Descripción del Viaje:**
        ${userData.description}

        **Fechas de Viaje:**
        - Inicio: ${userData.travelDates.startDate}
        - Fin: ${userData.travelDates.endDate}

        **Preferencias de Destino:**
        - Tipo de destino: ${userData.destinationPreferences.type}
        - Región preferida: ${userData.destinationPreferences.region}
        - Clima deseado: ${userData.destinationPreferences.climate}

        **Presupuesto:**
        - Total: ${userData.budget.total}
        - Distribución: ${userData.budget.allocation}

        **Intereses y Actividades:**
        - ${userData.interests.join(', ')}

        **Preferencias de Alojamiento:**
        - Tipo: ${userData.accommodationPreferences.type}
        - Nivel de lujo: ${userData.accommodationPreferences.stars}
        - Ubicación preferida: ${userData.accommodationPreferences.location}
        - Servicios específicos: ${userData.accommodationPreferences.amenities.join(', ')}

        **Transporte:**
        - Medio preferido: ${userData.transportPreferences.preferredMode}
        - Preferencias de movilidad: ${userData.transportPreferences.mobility}
        - Necesidades especiales: ${userData.transportPreferences.specialNeeds || 'Ninguna'}

        **Comida y Dieta:**
        - Tipos de cocina favoritas: ${userData.foodPreferences.cuisine.join(', ')}
        - Restricciones dietéticas: ${userData.foodPreferences.dietaryRestrictions || 'Ninguna'}
        - Experiencias culinarias: ${userData.foodPreferences.culinaryExperiences.join(', ')}

        **Compañía de Viaje:**
        - Tipo de viaje: ${userData.travelCompanion.type}
        - Edades de los viajeros: ${userData.travelCompanion.ages.join(', ')}
        - Requisitos especiales: ${userData.travelCompanion.specialRequirements || 'Ninguno'}

        **Nivel de Actividad:**
        - Ritmo del viaje: ${userData.activityLevel.pace}
        - Preferencia de tiempo libre: ${userData.activityLevel.freeTimePreference}

        **Otros Aspectos Importantes:**
        - ${userData.additionalPreferences || 'Ninguno'}

        ${activitiesDescription}

        **Instrucciones Adicionales:**
        - La respuesta debe ser únicamente el JSON sin ningún otro texto ni formateo, sin incluir \`\`\`json ni \`\`\`.
    `;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "Eres un asistente útil para planificar viajes." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 7000,
                temperature: 0.7,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
            }
        );

        const itineraryText = response.data.choices[0].message.content.trim();

        let jsonString = itineraryText;

        if (itineraryText.startsWith('```json') && itineraryText.endsWith('```')) {
            const lines = itineraryText.split('\n');
            if (lines.length >= 3 && lines[0].startsWith('```json') && lines[lines.length - 1].startsWith('```')) {
                lines.shift();
                lines.pop();
                jsonString = lines.join('\n').trim();
            }
        }

        jsonString = jsonString.replace(/```json\s*/, '').replace(/```$/, '').trim();

        let itinerary;
        try {
            itinerary = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('Error al parsear el itinerario JSON:', parseError);
            console.error('Respuesta completa de OpenAI:', itineraryText);
            throw new Error('No se pudo generar un itinerario válido.');
        }

        return itinerary;
    } catch (error) {
        console.error('Error al generar el itinerario con OpenAI:', error.response ? error.response.data : error.message);
        throw new Error('No se pudo generar el itinerario.');
    }
}

exports.getPopularTrips = async (req, res) => {
    try {
        const trips = await Trip.find({ public: true }).sort({ createdAt: -1 }).limit(10);
        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.searchTrips = async (req, res) => {
    try {
        const { query } = req.body;
        const trips = await Trip.find({ public: true, $text: { $search: query } });
        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getUserTrips = async (req, res) => {
    try {
        const userId = req.userId;
        const trips = await Trip.find({ createdBy: userId });
        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getTripsBySpecifications = async (req, res) => {
    try {
        const userId = req.userId;
        const { specifications } = req.body;

        let query = { public: true };
        if (specifications) {
            query.$text = { $search: specifications };
        }

        let trips = await Trip.find(query).populate('createdBy', 'username');

        const user = await User.findById(userId);
        const friendsTrips = await Trip.find({
            createdBy: { $in: user.friends },
            public: false,
            $text: { $search: specifications },
        }).populate('createdBy', 'username');

        trips = trips.concat(friendsTrips);

        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};
