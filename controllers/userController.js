const User = require('../models/User');
const Trip = require('../models/Trip');

exports.addFriend = async (req, res) => {
    try {
        const userId = req.userId;
        const { friendId } = req.body;

        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!friend) return res.status(404).json({ msg: 'Usuario no encontrado' });

        if (!friend.friendRequests.includes(userId)) {
            friend.friendRequests.push(userId);
            await friend.save();
        }

        res.json({ msg: 'Solicitud de amistad enviada' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.acceptFriendRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { requestId } = req.body;

        const user = await User.findById(userId);
        const requester = await User.findById(requestId);

        if (!requester) return res.status(404).json({ msg: 'Usuario no encontrado' });

        if (user.friendRequests.includes(requestId)) {
            user.friendRequests = user.friendRequests.filter((id) => id.toString() !== requestId);
            user.friends.push(requestId);
            await user.save();

            requester.friends.push(userId);
            await requester.save();

            res.json({ msg: 'Solicitud de amistad aceptada' });
        } else {
            res.status(400).json({ msg: 'No hay solicitud de amistad de este usuario' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.addFavoriteTrip = async (req, res) => {
    try {
        const userId = req.userId;
        const { tripId } = req.body;

        const trip = await Trip.findOne({
            _id: tripId,
            $or: [
                { public: true },
                { createdBy: userId },
                { createdBy: { $in: (await User.findById(userId)).friends } },
            ],
        });

        if (!trip) {
            return res.status(404).json({ msg: 'Itinerario no encontrado o no tienes acceso' });
        }

        const user = await User.findById(userId);

        if (user.favorites.includes(tripId)) {
            return res.status(400).json({ msg: 'El itinerario ya está en favoritos' });
        }

        user.favorites.push(tripId);
        await user.save();

        res.json({ msg: 'Itinerario agregado a favoritos' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.removeFavoriteTrip = async (req, res) => {
    try {
        const userId = req.userId;
        const { tripId } = req.body;

        const user = await User.findById(userId);

        if (!user.favorites.includes(tripId)) {
            return res.status(400).json({ msg: 'El itinerario no está en favoritos' });
        }

        user.favorites = user.favorites.filter((id) => id.toString() !== tripId);
        await user.save();

        res.json({ msg: 'Itinerario eliminado de favoritos' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getFavoriteTrips = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).populate({
            path: 'favorites',
            populate: { path: 'createdBy', select: 'username' },
        });

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json({ favorites: user.favorites });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};


exports.getFriendTrips = async (req, res) => {
    try {
        const userId = req.userId;
        const { friendId } = req.params;

        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!friend) return res.status(404).json({ msg: 'Usuario no encontrado' });

        if (user.friends.includes(friendId)) {
            const trips = await Trip.find({ createdBy: friendId });
            res.json(trips);
        } else {
            res.status(403).json({ msg: 'No eres amigo de este usuario' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getFriendRequests = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).populate('friendRequests', 'username email');

        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        res.json({ friendRequests: user.friendRequests });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};