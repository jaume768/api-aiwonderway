const axios = require('axios');
const qs = require('qs');
const Hotel = require('../models/Hotel');

let amadeusToken = null;
let tokenExpirationTime = null;

async function fetchAmadeusHotels(cityCode, numHotels = 4) {
    try {
        let hotelsInDB = await Hotel.find({ cityCode });

        if (hotelsInDB.length >= numHotels) {
            hotelsInDB = shuffleArray(hotelsInDB).slice(0, numHotels);
            return hotelsInDB;
        } else {
            const token = await getAmadeusToken();

            const response = await axios.get(`https://api.amadeus.com/v1/reference-data/locations/hotels/by-city`, {
                params: { cityCode },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const hotelsData = response.data.data;

            if (!hotelsData || hotelsData.length === 0) {
                throw new Error(`No se encontraron hoteles para la ciudad con código IATA "${cityCode}".`);
            }

            const hotelDocs = hotelsData.map((hotel) => {
                if (!hotel.address || !Array.isArray(hotel.address.lines)) {
                    console.warn(`Hotel con ID ${hotel.hotelId} tiene una dirección inválida:`, hotel.address);
                }

                return {
                    hotelId: hotel.hotelId,
                    name: hotel.name,
                    address: Array.isArray(hotel.address?.lines) ? hotel.address.lines.join(', ') : 'No disponible',
                    rating: hotel.rating || 'No disponible',
                    amenities: hotel.amenities || [],
                    price: 'No disponible',
                    cityCode: hotel.iataCode,
                    geoCode: hotel.geoCode || {},
                    lastUpdate: hotel.lastUpdate ? new Date(hotel.lastUpdate) : null,
                };
            });

            await Hotel.insertMany(hotelDocs);

            hotelsInDB = shuffleArray(hotelDocs).slice(0, numHotels);
            return hotelsInDB;
        }
    } catch (error) {
        console.error(`Error al obtener hoteles para el código IATA "${cityCode}":`, error.message);
        return [];
    }
}

async function getAmadeusToken() {
    if (amadeusToken && tokenExpirationTime && new Date() < tokenExpirationTime) {
        return amadeusToken;
    }

    try {
        const requestBody = qs.stringify({
            grant_type: 'client_credentials',
            client_id: process.env.AMADEUS_API_KEY,
            client_secret: process.env.AMADEUS_API_SECRET,
        });

        const response = await axios.post('https://api.amadeus.com/v1/security/oauth2/token', requestBody, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        amadeusToken = response.data.access_token;
        const expiresIn = response.data.expires_in;

        tokenExpirationTime = new Date(new Date().getTime() + expiresIn * 1000);

        return amadeusToken;
    } catch (error) {
        console.error('Error al obtener el token de Amadeus:', error.response ? error.response.data : error.message);
        throw new Error('No se pudo obtener el token de Amadeus.');
    }
}

function shuffleArray(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function obtenerSitiosWebHoteles(nombresHoteles) {
    const apiKey = process.env.OPENAI_API_KEY;

    const prompt = `
    Tengo una lista de nombres de hoteles y necesito obtener las páginas web oficiales de cada uno. Por favor, proporciona una lista en formato JSON donde cada entrada tenga el nombre del hotel y su correspondiente sitio web.

    Lista de hoteles:
    ${nombresHoteles.map((name, index) => `${index + 1}. ${name}`).join('\n')}

    Formato de respuesta:
    [
        {
            "nombre": "Nombre del Hotel",
            "sitio_web": "URL del sitio web"
        },
        ...
    ]
    `;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "Eres un asistente útil que puede proporcionar sitios web oficiales de hoteles basándote en sus nombres." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 6000,
                temperature: 0.2,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
            }
        );

        const respuesta = response.data.choices[0].message.content.trim();

        let sitiosWeb;
        try {
            sitiosWeb = JSON.parse(respuesta);
        } catch (error) {
            const regex = /\{\s*"nombre":\s*"(.+?)",\s*"sitio_web":\s*"(.+?)"\s*\}/g;
            sitiosWeb = [];
            let match;
            while ((match = regex.exec(respuesta)) !== null) {
                sitiosWeb.push({
                    nombre: match[1],
                    sitio_web: match[2],
                });
            }
        }

        return sitiosWeb;
    } catch (error) {
        console.error('Error al obtener sitios web de hoteles:', error.response ? error.response.data : error.message);
        throw new Error('No se pudo obtener los sitios web de los hoteles.');
    }
}

async function actualizarHotelesConSitiosWeb(cityCode, numHotels = 4) {
    const hoteles = await fetchAmadeusHotels(cityCode, numHotels);
    const nombresHoteles = hoteles.map(hotel => hotel.name);

    const sitiosWeb = await obtenerSitiosWebHoteles(nombresHoteles);

    const hotelesActualizados = hoteles.map(hotel => {
        const sitio = sitiosWeb.find(sw => sw.nombre.toLowerCase() === hotel.name.toLowerCase());
        return {
            ...hotel,
            website: sitio ? sitio.sitio_web : 'No disponible',
            imageUrl: hotel.imageUrl || 'https://via.placeholder.com/150',
        };
    });

    for (const hotelActualizado of hotelesActualizados) {
        await Hotel.updateOne(
            { hotelId: hotelActualizado.hotelId },
            { 
                website: hotelActualizado.website,
                imageUrl: hotelActualizado.imageUrl,
            }
        );
    }

    return hotelesActualizados;
}

module.exports = actualizarHotelesConSitiosWeb;