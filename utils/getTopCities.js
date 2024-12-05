const axios = require('axios');

async function getTopCities(country, numberOfCities = 3) {
    const apiKey = process.env.OPENAI_API_KEY;

    const prompt = `
        Proporciona una lista en formato JSON de las ${numberOfCities} ciudades más importantes de ${country}. 
        Para cada ciudad, proporciona el nombre en español (en minúsculas y sin acentos) y en inglés (quiero la IATA de la ciudad, por ejemplo MAD). 
        La respuesta debe ser un array JSON de objetos con la estructura:
        [
            { "spanish": "nombre en español sin acentos y en minúsculas", "english": "IATA en mayusculas" },
            ...
        ]
    `;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o-mini",
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
            return [];
        }

        let cities;
        try {
            cities = JSON.parse(citiesText);
        } catch (parseError) {
            return [];
        }

        if (!Array.isArray(cities) || cities.length === 0) {
            return [];
        }

        cities = cities.filter(city => city.spanish && city.english);

        if (cities.length === 0) {
            return [];
        }

        return cities.slice(0, numberOfCities);
    } catch (error) {
        return [];
    }
}

module.exports = getTopCities;