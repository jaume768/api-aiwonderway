const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('./utils/passport');
const cors = require('cors');
const session = require('express-session');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta nuevamente después de un minuto',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use(express.json());
app.use(cors());

app.use(session({
  secret: process.env.SESSION_SECRET || 'un_secret_seguro',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Importar rutas
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/paymentRoutes');
const commentRoutes = require('./routes/comments');
const searchRoutes = require('./routes/search');
const { checkUserSubscriptions } = require('./utils/scheduler');

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', reviewRoutes);
app.use('/api', commentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/payments', paymentRoutes);

checkUserSubscriptions();

// Conexión a MongoDB
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
