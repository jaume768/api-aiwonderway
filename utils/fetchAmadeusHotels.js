const axios = require('axios');
const Hotel = require('../models/Hotel');

async function fetchAmadeusHotels(cityCode,numHotels) {
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

            const hotelDocs = hotelsData.map((hotel) => ({
                hotelId: hotel.hotelId,
                name: hotel.name,
                address: hotel.address.lines ? hotel.address.lines.join(', ') : 'No disponible',
                rating: hotel.rating || 'No disponible',
                amenities: hotel.amenities || [],
                price: 'No disponible',
                cityCode: hotel.iataCode,
                geoCode: hotel.geoCode || {},
                lastUpdate: hotel.lastUpdate ? new Date(hotel.lastUpdate) : null,
            }));

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
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', process.env.AMADEUS_API_KEY);
        params.append('client_secret', process.env.AMADEUS_API_SECRET);

        const response = await axios.post('https://api.amadeus.com/v1/security/oauth2/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        return response.data.access_token;
    } catch (error) {
        if (error.response) {
            console.error('Error al obtener el token de Amadeus:', error.response.data);
        } else {
            console.error('Error al obtener el token de Amadeus:', error.message);
        }
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