const axios = require('axios');
const cheerio = require('cheerio');

async function fetchCivitatisActivities(city, numActivities) {
    if (!city) {
        throw new Error('La ciudad es requerida como parámetro.');
    }

    const cityFormatted = city.toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.civitatis.com/es/${cityFormatted}/`;

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const activities = [];

        $('article.compact-card, article.comfort-card').each((index, element) => {
            const title = $(element).find('.compact-card__title, .comfort-card__title').text().trim() || 'Título no disponible';

            const linkRelative = $(element).find('a.compact-card__link, a._activity-link, a.ga-trackEvent-element').attr('href');
            const link = linkRelative ? `https://www.civitatis.com${linkRelative}` : 'Enlace no disponible';

            let imageUrl = 'Imagen no disponible';
            const imgElement = $(element).find('.compact-card__img img, .comfort-card__img img');
            if (imgElement.length > 0) {
                const dataSrc = imgElement.attr('data-src');
                const dataSrcMobile = imgElement.attr('data-src-mobile');
                if (dataSrc) {
                    imageUrl = dataSrc.startsWith('http') ? dataSrc : `https://www.civitatis.com${dataSrc}`;
                } else if (dataSrcMobile) {
                    imageUrl = dataSrcMobile.startsWith('http') ? dataSrcMobile : `https://www.civitatis.com${dataSrcMobile}`;
                } else {
                    const src = imgElement.attr('src');
                    imageUrl = src ? (src.startsWith('http') ? src : `https://www.civitatis.com${src}`) : 'Imagen no disponible';
                }
            }

            let rating = 'Sin calificación';
            const ratingRaw = $(element).find('.m-rating--text').first().text().trim();
            if (ratingRaw && !ratingRaw.toLowerCase().includes('sin valorar')) {
                rating = ratingRaw.replace(/\s+/g, ' ').replace('/ 10', '').trim();
            }

            let reviews = '0';
            const reviewsRaw = $(element).find('.text--rating-total').first().text().trim();
            if (reviewsRaw && !reviewsRaw.toLowerCase().includes('sin valorar')) {
                reviews = reviewsRaw.replace(/\s+/g, ' ').replace('opiniones', '').replace('.', '').trim();
            }

            let price = 'Gratis';
            const priceElement = $(element).find('.compact-card__price__text, .comfort-card__price__text');
            if (priceElement.length > 0) {
                price = priceElement.text().trim();
            }

            activities.push({
                title: title,
                link: link,
                imageUrl: imageUrl,
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