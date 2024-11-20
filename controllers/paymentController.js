const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

exports.createSubscriptionSession = async (req, res) => {
    try {
        const { subscriptionType } = req.body;
        const validSubscriptions = ['Premium', 'Pro', 'Vip'];

        if (!validSubscriptions.includes(subscriptionType)) {
            return res.status(400).json({ msg: 'Tipo de suscripción inválido' });
        }

        const prices = {
            Premium: 'price_premium_id', // Reemplazar por las ID de los productos en stripe
            Pro: 'price_pro_id',
            Vip: 'price_vip_id',
        };

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{
                price: prices[subscriptionType],
                quantity: 1,
            }],
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/cancel`,
            metadata: {
                userId: req.userId,
                subscriptionType,
            },
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

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

exports.stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleCheckoutSession(session);
            break;
        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            await handleInvoicePaymentSucceeded(invoice);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};

const handleCheckoutSession = async (session) => {
    const userId = session.metadata.userId;
    const subscriptionType = session.metadata.subscriptionType;
    const credits = session.metadata.credits;

    if (session.mode === 'subscription') {
        // Actualizar la suscripción del usuario
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        const user = await User.findById(userId);
        if (user) {
            user.role = subscriptionType.toLowerCase();
            user.subscriptionExpiry = expiryDate;

            const creditsPerPlan = {
                Premium: 660,
                Pro: 3000,
                Vip: 8000,
            };

            user.credits += creditsPerPlan[subscriptionType];
            user.paymentHistory.push({
                productId: session.subscription,
                purchaseToken: session.id,
                purchaseDate: new Date(),
                amount: session.amount_total / 100, // Asumiendo que amount_total está en centavos
                currency: session.currency,
                transactionType: 'Subscription',
                status: 'Completed',
            });

            await user.save();
        }
    } else if (session.mode === 'payment') {
        // Actualizar los créditos del usuario
        const user = await User.findById(userId);
        if (user) {
            user.credits += parseInt(credits, 10);
            user.paymentHistory.push({
                productId: 'credits_purchase',
                purchaseToken: session.id,
                purchaseDate: new Date(),
                amount: session.amount_total / 100,
                currency: session.currency,
                transactionType: 'CreditPurchase',
                status: 'Completed',
            });

            await user.save();
        }
    }
};

// Función para manejar pagos de facturas (por ejemplo, renovación de suscripciones)
const handleInvoicePaymentSucceeded = async (invoice) => {
    const subscriptionId = invoice.subscription;
    const user = await User.findOne({ 'paymentHistory.productId': subscriptionId });

    if (user) {
        // Actualizar la fecha de expiración
        user.subscriptionExpiry = new Date(invoice.period_end * 1000); // Stripe usa timestamps en segundos
        await user.save();
    }
};

