const axios = require('axios');

async function getTopCities(country, numberOfCities = 3) {
    const apiKey = process.env.OPENAI_API_KEY;

    const prompt = `
        Proporciona una lista en formato JSON de las ${numberOfCities} ciudades más importantes de ${country}. 
        Para cada ciudad, proporciona el nombre en español (en minúsculas y sin acentos) y en inglés (con la primera letra en mayúscula). 
        La respuesta debe ser un array JSON de objetos con la estructura:
        [
            { "spanish": "nombre en español sin acentos y en minúsculas", "english": "Nombre en inglés con la primera letra en mayúscula" },
            ...
        ]
    `;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4",
                messages: [
                    { role: "system", content: "Eres un experto en geografía y turismo." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 200,
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

        const jsonMatch = citiesText.match(/\[.*\]/s);
        if (jsonMatch) {
            citiesText = jsonMatch[0];
        } else {
            throw new Error('No se pudo extraer el JSON de ciudades de la respuesta de OpenAI.');
        }

        const cities = JSON.parse(citiesText);

        if (!Array.isArray(cities) || cities.length < numberOfCities) {
            throw new Error('La respuesta de OpenAI no contiene una lista válida de ciudades.');
        }

        return cities.slice(0, numberOfCities);
    } catch (error) {
        console.error('Error al obtener las ciudades desde OpenAI:', error.response ? error.response.data : error.message);
        throw new Error('No se pudo obtener las ciudades principales del país.');
    }
}

module.exports = getTopCities;
