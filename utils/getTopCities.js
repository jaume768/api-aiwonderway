const { chatCompletion } = require('./openai');

async function getTopCities(country, numberOfCities = 3) {
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
        let citiesText = await chatCompletion({
            system: "Eres un experto en geografía y turismo.",
            user: prompt,
            maxTokens: 400,
            temperature: 0.3,
        });

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