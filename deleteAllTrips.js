// deleteAllTrips.js

require('dotenv').config(); // Cargar variables de entorno desde .env
const mongoose = require('mongoose');
const Trip = require('./models/Trip'); // Ajusta la ruta según tu estructura de proyecto
const readline = require('readline');

// Configuración del prompt para confirmar la eliminación
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función principal para eliminar los viajes (trips)
const deleteAllTrips = async () => {
    try {
        // Conectar a la base de datos
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Conectado a MongoDB.');

        // Confirmación del usuario
        rl.question('¿Estás seguro de que deseas eliminar TODOS los viajes (trips) de la base de datos? (escribe "sí" para continuar): ', async (answer) => {
            if (answer.toLowerCase() === 'sí' || answer.toLowerCase() === 'si') {
                const result = await Trip.deleteMany({});
                console.log(`Se han eliminado ${result.deletedCount} viajes de la base de datos.`);
            } else {
                console.log('Operación cancelada.');
            }

            // Cerrar la conexión y el prompt
            mongoose.connection.close();
            rl.close();
        });

    } catch (error) {
        console.error('Error al eliminar los viajes:', error);
        mongoose.connection.close();
        rl.close();
    }
};

deleteAllTrips();
