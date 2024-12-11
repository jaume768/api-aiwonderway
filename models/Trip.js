const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tripSchema = new Schema(
    {
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        collaborators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        title: { type: String, required: true },
        imageUrl: { type: String }, // Campo para la imagen
        link: { type: String }, // Campo para el link externo
        description: { type: String, required: true },
        itinerary: { type: Schema.Types.Mixed, required: true }, // Guardar como objeto JSON
        public: { type: Boolean, default: true },
        reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
        comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
        travelDates: {
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
        },
        destinationPreferences: {
            type: {
                type: String, // Playa, montaña, ciudad, etc.
                enum: ['Playa', 'Montaña', 'Ciudad', 'Campo', 'Otro','Aventura'],
                required: true,
            },
            region: { type: String },
            climate: { type: String },
        },
        budget: {
            total: { type: Number, required: true },
            allocation: { type: String }, // Ejemplo: "70% alojamiento, 20% actividades, 10% comidas"
        },
        interests: [{ type: String }], // Array de intereses
        accommodationPreferences: {
            type: { type: String, required: true }, // Hotel, hostal, apartamento, resort, etc.
            stars: { type: String }, // Básico, estándar, lujo
            location: { type: String }, // Cerca de atracciones, en el centro, etc.
            amenities: [{ type: String }], // Wi-Fi, desayuno incluido, piscina, etc.
        },
        transportPreferences: {
            preferredMode: { type: String, required: true }, // Avión, tren, autobús, coche de alquiler, etc.
            mobility: { type: String }, // Transporte público, alquiler de vehículos, caminar, bicicleta
            specialNeeds: { type: String }, // Accesibilidad, transporte para mascotas, etc.
        },
        foodPreferences: {
            cuisine: [{ type: String }], // Tipos de cocina favoritas
            dietaryRestrictions: { type: String }, // Vegetarianismo, veganismo, alergias, etc.
            culinaryExperiences: [{ type: String }], // Clases de cocina, tours gastronómicos, etc.
        },
        travelCompanion: {
            type: { type: String, required: true }, // Solo, en pareja, familiar, con amigos, etc.
            ages: [{ type: Number }], // Edades de los viajeros
            specialRequirements: { type: String }, // Necesidades especiales
        },
        activityLevel: {
            pace: { type: String, required: true }, // Relajado, moderado, activo/intenso
            freeTimePreference: { type: String }, // Tiempo para descansar vs. tiempo para explorar
        },
        additionalPreferences: { type: String }, // Otros aspectos importantes
    },
    { timestamps: true }
);

tripSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Trip', tripSchema);
