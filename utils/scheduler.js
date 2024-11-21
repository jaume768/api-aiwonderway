const cron = require('node-cron');
const User = require('../models/User');

function checkUserSubscriptions() {
  cron.schedule('0 0 * * *', async () => {
    console.log('Ejecutando verificación diaria de suscripciones');

    try {
      const now = new Date();
      const users = await User.find({
        role: { $ne: 'free' },
        subscriptionExpiry: { $lte: now },
      });

      for (const user of users) {
        user.role = 'free';
        user.subscriptionExpiry = null;
        await user.save();
        console.log(`Actualizada la suscripción del usuario ${user.username} a Free`);
      }
    } catch (err) {
      console.error('Error al verificar suscripciones:', err);
    }
  });
}

module.exports = {
  checkUserSubscriptions,
};