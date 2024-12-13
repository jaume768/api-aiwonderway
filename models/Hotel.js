const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
    {
        hotelId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        address: { type: String },
        rating: { type: String },
        amenities: [{ type: String }],
        price: { type: String },
        cityCode: { type: String, required: true },
        geoCode: {
            latitude: { type: Number },
            longitude: { type: Number },
        },
        lastUpdate: { type: Date },
        checkInDate: { type: String },
        checkOutDate: { type: String },
        roomType: { type: String },
        website: { type: String }, // Nuevo campo para la URL del sitio web
        imageUrl: { type: String }, // Nuevo campo opcional para la imagen del hotel
    },
    { timestamps: true }
);

module.exports = mongoose.model('Hotel', hotelSchema);