// controllers/adminController.js

const User = require('../models/User');
const Trip = require('../models/Trip');
const Review = require('../models/Review');
const Comment = require('../models/Comment');
const Hotel = require('../models/Hotel');

exports.getDashboard = async (req, res) => {
    res.json({ msg: 'Bienvenido al panel de administración' });
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// Obtener información de un usuario específico
exports.getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// Actualizar datos de un usuario
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        await User.findByIdAndDelete(userId);
        res.json({ msg: 'Usuario eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// Obtener reseñas de un usuario
exports.getUserReviews = async (req, res) => {
    try {
        const { userId } = req.params;
        const reviews = await Review.find({ user: userId }).populate('trip', 'title');
        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// Actualizar una reseña
exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const updates = req.body;

        const review = await Review.findByIdAndUpdate(reviewId, updates, { new: true });
        if (!review) {
            return res.status(404).json({ msg: 'Reseña no encontrada' });
        }
        res.json(review);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// Eliminar una reseña
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        await Review.findByIdAndDelete(reviewId);
        res.json({ msg: 'Reseña eliminada' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// Obtener comentarios de un usuario
exports.getUserComments = async (req, res) => {
    try {
        const { userId } = req.params;
        const comments = await Comment.find({ user: userId }).populate('trip', 'title');
        res.json(comments);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// Actualizar un comentario
exports.updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const updates = req.body;

        const comment = await Comment.findByIdAndUpdate(commentId, updates, { new: true });
        if (!comment) {
            return res.status(404).json({ msg: 'Comentario no encontrado' });
        }
        res.json(comment);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// Eliminar un comentario
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        await Comment.findByIdAndDelete(commentId);
        res.json({ msg: 'Comentario eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// Obtener itinerarios de un usuario
exports.getUserTrips = async (req, res) => {
    try {
        const { userId } = req.params;
        const trips = await Trip.find({ createdBy: userId });
        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// Obtener todos los hoteles
exports.getAllHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find();
        res.json(hotels);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// Actualizar información de un hotel
exports.updateHotel = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const updates = req.body;

        const hotel = await Hotel.findByIdAndUpdate(hotelId, updates, { new: true });
        if (!hotel) {
            return res.status(404).json({ msg: 'Hotel no encontrado' });
        }
        res.json(hotel);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// Eliminar un hotel
exports.deleteHotel = async (req, res) => {
    try {
        const { hotelId } = req.params;
        await Hotel.findByIdAndDelete(hotelId);
        res.json({ msg: 'Hotel eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};
