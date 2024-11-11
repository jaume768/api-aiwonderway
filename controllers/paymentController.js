const User = require('../models/User');

exports.updateSubscription = async (req, res) => {
    try {
        const userId = req.userId;
        const { subscriptionType, expiryDate } = req.body;

        if (!subscriptionType || !expiryDate) {
            return res.status(400).json({ msg: 'Faltan datos necesarios' });
        }

        const validSubscriptions = ['Premium', 'Pro', 'Vip'];
        if (!validSubscriptions.includes(subscriptionType)) {
            return res.status(400).json({ msg: 'Tipo de suscripción inválido' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        user.role = subscriptionType.toLowerCase();
        user.subscriptionExpiry = new Date(expiryDate);

        const creditsPerPlan = {
            Premium: 660,
            Pro: 3000,
            Vip: 8000,
        };

        user.credits += creditsPerPlan[subscriptionType];

        await user.save();

        res.json({ msg: 'Suscripción actualizada exitosamente', user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.addCredits = async (req, res) => {
    try {
        const userId = req.userId;
        const { credits } = req.body;

        if (!credits || credits <= 0) {
            return res.status(400).json({ msg: 'Cantidad de créditos inválida' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        user.credits += credits;

        await user.save();

        res.json({ msg: 'Créditos añadidos exitosamente', credits: user.credits });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).select('subscription subscriptionExpiry credits');

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json({
            subscription: user.role,
            subscriptionExpiry: user.subscriptionExpiry,
            credits: user.credits,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getPaymentHistory = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).select('paymentHistory');

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json({ paymentHistory: user.paymentHistory });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};
