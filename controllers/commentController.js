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

exports.updateComment = async (req, res) => {
    try {
        const userId = req.userId;
        const { commentId } = req.params;
        const { content } = req.body;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ msg: 'Comentario no encontrado' });
        }

        if (comment.user.toString() !== userId) {
            return res.status(403).json({ msg: 'No tienes permiso para editar este comentario' });
        }

        comment.content = content;
        await comment.save();

        res.json(comment);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const userId = req.userId;
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ msg: 'Comentario no encontrado' });
        }

        if (comment.user.toString() !== userId) {
            return res.status(403).json({ msg: 'No tienes permiso para eliminar este comentario' });
        }

        await comment.remove();

        await Trip.findByIdAndUpdate(comment.trip, {
            $pull: { comments: commentId },
        });

        res.json({ msg: 'Comentario eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};