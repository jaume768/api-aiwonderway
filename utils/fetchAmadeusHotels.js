const Amadeus = require('amadeus');

const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_API_KEY,
    clientSecret: process.env.AMADEUS_API_SECRET,
    hostname: 'test' // se tiene que cambiar a production para que funcione
});

async function fetchAmadeusHotels(city, checkInDate, checkOutDate, numHotels = 5) {
    try {
        const citySearchResponse = await amadeus.referenceData.locations.get({
            keyword: city,
            subType: 'CITY'
        });

        if (citySearchResponse.status !== 200 || citySearchResponse.data.length === 0) {
            throw new Error(`No se encontró el código IATA para la ciudad "${city}".`);
        }

        const cityCode = citySearchResponse.data[0].iataCode;

        const hotelsResponse = await amadeus.shopping.hotelOffers.get({
            cityCode: cityCode,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            adults: 1,
            roomQuantity: 1,
        });

        if (hotelsResponse.status !== 200 || hotelsResponse.data.length === 0) {
            throw new Error(`No se encontraron hoteles para la ciudad "${city}".`);
        }

        const hotels = hotelsResponse.data.slice(0, numHotels).map(hotelOffer => {
            const hotel = hotelOffer.hotel;
            return {
                name: hotel.name,
                address: hotel.address.lines.join(', ') + ', ' + hotel.address.cityName,
                rating: hotel.rating || 'No disponible',
                amenities: hotel.amenities ? hotel.amenities.join(', ') : 'No disponible',
                price: hotelOffer.offers[0].price.total + ' ' + hotelOffer.offers[0].price.currency,
                checkInDate: hotelOffer.offers[0].checkInDate,
                checkOutDate: hotelOffer.offers[0].checkOutDate,
                roomType: hotelOffer.offers[0].room.typeEstimated ? hotelOffer.offers[0].room.typeEstimated.category : 'No especificado'
            };
        });

        return hotels;
    } catch (error) {
        console.error(`Error al obtener hoteles para la ciudad "${city}":`, error.message);
        return [];
    }
}

module.exports = fetchAmadeusHotels;
