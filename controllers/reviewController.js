const Review = require('../models/Review');
const Trip = require('../models/Trip');

exports.createReview = async (req, res) => {
    try {
        const userId = req.userId;
        const { tripId } = req.params;
        const { rating, comment } = req.body;

        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ msg: 'Itinerario no encontrado' });
        }

        const existingReview = await Review.findOne({ user: userId, trip: tripId });
        if (existingReview) {
            return res.status(400).json({ msg: 'Ya has dejado una reseña para este itinerario' });
        }

        const review = new Review({
            user: userId,
            trip: tripId,
            rating,
            comment,
        });

        await review.save();

        trip.reviews.push(review._id);
        await trip.save();

        res.json(review);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getReviewsForTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        const reviews = await Review.find({ trip: tripId }).populate('user', 'username');
        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// faltan endpoints para eliminar reseñas y editarlas