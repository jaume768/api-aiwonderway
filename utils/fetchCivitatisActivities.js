const axios = require('axios');
const cheerio = require('cheerio');

async function fetchCivitatisActivities(city,numActivities) {
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

        const limitedActivities = activities.slice(0, numActivities);

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

module.exports = fetchCivitatisActivities;
