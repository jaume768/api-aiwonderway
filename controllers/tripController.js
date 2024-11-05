const Trip = require('../models/Trip');
const User = require('../models/User');
const axios = require('axios');

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

        const itinerary = await generateItinerary({
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
            description
        });

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
                max_tokens: 2000,
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
