const axios = require('axios');

async function generateItinerary(userData) {
    const apiKey = process.env.OPENAI_API_KEY;

    const interests = Array.isArray(userData.interests) ? userData.interests : [];
    const amenities = Array.isArray(userData.accommodationPreferences?.amenities) ? userData.accommodationPreferences.amenities : [];
    const cuisine = Array.isArray(userData.foodPreferences?.cuisine) ? userData.foodPreferences.cuisine : [];
    const culinaryExperiences = Array.isArray(userData.foodPreferences?.culinaryExperiences) ? userData.foodPreferences.culinaryExperiences : [];
    const ages = Array.isArray(userData.travelCompanion?.ages) ? userData.travelCompanion.ages : [];

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

    let hotelsDescription = '';
    if (userData.hotelsPerCity && Object.keys(userData.hotelsPerCity).length > 0) {
        hotelsDescription += 'Aquí tienes algunos hoteles recomendados para las ciudades principales:\n';
        for (const [city, hotels] of Object.entries(userData.hotelsPerCity)) {
            hotelsDescription += `\n**${city}:**\n`;
            hotels.forEach((hotel, index) => {
                hotelsDescription += `${index + 1}. ${hotel.name} - ${hotel.address} - Rating: ${hotel.rating}\n`;
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
                "alojamiento": "Nombre del hotel recomendado",
                "transporte": "Detalles sobre transporte si aplica"
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
        - ${interests.join(', ')}

        **Preferencias de Alojamiento:**
        - Tipo: ${userData.accommodationPreferences.type}
        - Nivel de lujo: ${userData.accommodationPreferences.stars}
        - Ubicación preferida: ${userData.accommodationPreferences.location}
        - Servicios específicos: ${amenities.join(', ')}

        **Transporte:**
        - Medio preferido: ${userData.transportPreferences.preferredMode}
        - Preferencias de movilidad: ${userData.transportPreferences.mobility}
        - Necesidades especiales: ${userData.transportPreferences.specialNeeds || 'Ninguna'}

        **Comida y Dieta:**
        - Tipos de cocina favoritas: ${cuisine.join(', ')}
        - Restricciones dietéticas: ${userData.foodPreferences.dietaryRestrictions || 'Ninguna'}
        - Experiencias culinarias: ${culinaryExperiences.join(', ')}

        **Compañía de Viaje:**
        - Tipo de viaje: ${userData.travelCompanion.type}
        - Edades de los viajeros: ${ages.join(', ')}
        - Requisitos especiales: ${userData.travelCompanion.specialRequirements || 'Ninguno'}

        **Nivel de Actividad:**
        - Ritmo del viaje: ${userData.activityLevel.pace}
        - Preferencia de tiempo libre: ${userData.activityLevel.freeTimePreference}

        **Otros Aspectos Importantes:**
        - ${userData.additionalPreferences || 'Ninguno'}

        ${activitiesDescription}

        ${hotelsDescription}

        **Instrucciones Adicionales:**
        - La respuesta debe ser únicamente el JSON sin ningún otro texto ni formateo, sin incluir \`\`\`json ni \`\`\`.
        - Asegúrate de que cada día incluya recomendaciones de alojamiento basadas en las opciones de hoteles proporcionadas.
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
                max_tokens: 8000,
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

module.exports = generateItinerary;
