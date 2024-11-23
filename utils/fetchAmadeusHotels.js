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

module.exports = fetchAmadeusHotels;