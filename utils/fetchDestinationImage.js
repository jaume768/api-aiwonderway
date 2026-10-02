const axios = require('axios');

const WIKIPEDIA_API = 'https://es.wikipedia.org/w/api.php';
const REQUEST_OPTIONS = {
    headers: { 'User-Agent': 'TravelDaring/1.0 (https://traveldaring.websjfs.com)' },
    timeout: 8000,
};
const IMAGE_PARAMS = { action: 'query', format: 'json', prop: 'pageimages', piprop: 'thumbnail', pithumbsize: 960 };

// Imágenes que no sirven como foto de un viaje: logos, escudos, banderas, mapas...
const NOT_A_PHOTO = /logo|escudo|bandera|flag|coat|arms|mapa|map|locator|seal|emblem|icon/i;
const isPhoto = (url) => /\.jpe?g(\?|$)/i.test(url) && !NOT_A_PHOTO.test(decodeURIComponent(url));

const capitalize = (text) => text.replace(/(^|\s)\p{L}/gu, (letter) => letter.toUpperCase());

async function queryImages(params) {
    const response = await axios.get(WIKIPEDIA_API, { params: { ...IMAGE_PARAMS, ...params }, ...REQUEST_OPTIONS });
    return Object.values(response.data?.query?.pages || {})
        .sort((a, b) => (a.index || 0) - (b.index || 0))
        .map((page) => page.thumbnail?.source)
        .filter((source) => source && isPhoto(source));
}

// Devuelve la URL de una foto representativa de la ciudad (la imagen principal
// de su artículo en Wikipedia) o null si no se encuentra ninguna adecuada.
async function fetchDestinationImage(city, country) {
    if (!city) return null;

    try {
        // 1) El artículo de la ciudad, siguiendo redirecciones ("roma" -> "Roma").
        const byTitle = await queryImages({ titles: capitalize(city), redirects: 1 });
        if (byTitle.length > 0) return byTitle[0];

        // 2) Si el título es ambiguo o no existe, el mejor resultado de la búsqueda.
        const bySearch = await queryImages({
            generator: 'search',
            gsrsearch: [city, country].filter(Boolean).join(' '),
            gsrlimit: 5,
        });
        return bySearch[0] || null;
    } catch (error) {
        console.error(`Error al buscar una imagen para "${city}":`, error.message);
        return null;
    }
}

module.exports = fetchDestinationImage;
