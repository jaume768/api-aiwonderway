const Comment = require('../models/Comment');
const Trip = require('../models/Trip');

exports.createComment = async (req, res) => {
    try {
        const userId = req.userId;
        const { tripId } = req.params;
        const { content, parentCommentId } = req.body;

        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ msg: 'Itinerario no encontrado' });
        }

        const comment = new Comment({
            user: userId,
            trip: tripId,
            content,
            parentComment: parentCommentId || null,
        });

        await comment.save();

        trip.comments.push(comment._id);
        await trip.save();

        res.json(comment);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getCommentsForTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        const comments = await Comment.find({ trip: tripId })
            .populate('user', 'username')
            .populate('parentComment', 'content user');

        res.json(comments);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// falten endpoints de eliminar y editar commentaris