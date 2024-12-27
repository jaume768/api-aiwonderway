const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('./utils/passport');
const cors = require('cors');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const csurf = require('csurf');

dotenv.config();

const app = express();

// 1. Configurar 'trust proxy' si estás detrás de un proxy
app.set('trust proxy', 1); // Ajusta según tu infraestructura

// 2. Configuración de rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 50, // Limita cada IP a 50 peticiones por ventanaMs
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta nuevamente después de un minuto',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// 3. Configurar helmet para seguridad de cabeceras
app.use(helmet());

// 4. Configurar parseo de cuerpos de solicitudes con límites de tamaño
app.use(express.json({ limit: '10kb' })); // Limita el tamaño a 10KB
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// 5. Configuración de CORS con opciones
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS.split(','), // Lista de orígenes permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Permitir el envío de cookies
};

app.use(cors(corsOptions));

// 6. Configurar express-session antes de csurf
app.use(session({
  secret: process.env.SESSION_SECRET || 'un_secret_seguro',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Evita que el cliente acceda a la cookie
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    sameSite: 'lax', // Protege contra CSRF
    maxAge: 1000 * 60 * 60 * 24, // 1 día
  },
}));

// 7. Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// 8. Aplicar csurf después de session y passport
app.use(csurf());

// 9. Manejador de errores para CSRF
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  res.status(403).json({ message: 'Formulario inválido' });
});

// 10. Ruta para obtener el token CSRF
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// 11. Importar rutas
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/paymentRoutes');
const commentRoutes = require('./routes/comments');
const searchRoutes = require('./routes/search');
const { checkUserSubscriptions } = require('./utils/scheduler');

// 12. Definir rutas
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', reviewRoutes);
app.use('/api', commentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/payments', paymentRoutes);

// 13. Ejecutar tareas programadas
checkUserSubscriptions();

// 14. Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Conectado a MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((err) => console.log(err));
