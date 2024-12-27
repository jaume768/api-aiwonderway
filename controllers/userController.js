const User = require('../models/User');
const Trip = require('../models/Trip');
const mongoose = require('mongoose');
const { cloudinary } = require('../utils/cloudinary');

exports.uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.userId;

        if (!req.file || !req.file.path) {
            return res.status(400).json({ msg: 'No se ha subido ninguna imagen.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }

        if (user.profilePicture && user.profilePicture.public_id) {
            await cloudinary.uploader.destroy(user.profilePicture.public_id);
        }

        user.profilePicture = {
            url: req.file.path,
            public_id: req.file.filename,
        };

        await user.save();

        res.json({ msg: 'Foto de perfil actualizada exitosamente.', profilePicture: user.profilePicture });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error del servidor.' });
    }
};

exports.addFriend = async (req, res) => {
    try {
        const userId = req.userId;
        const { friendId } = req.body;

        if (userId === friendId) {
            return res.status(400).json({ msg: 'No puedes enviarte una solicitud de amistad a ti mismo' });
        }

        const [user, friend] = await Promise.all([
            User.findById(userId),
            User.findById(friendId)
        ]);

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        if (!friend) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        if (user.friends.includes(friendId)) {
            return res.status(400).json({ msg: 'Ya son amigos' });
        }

        if (friend.friendRequests.some(id => id.toString() === userId)) {
            return res.status(400).json({ msg: 'Ya has enviado una solicitud de amistad a este usuario' });
        }

        friend.friendRequests.push(userId);
        await friend.save();

        res.json({ msg: 'Solicitud de amistad enviada' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const requesterId = req.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ msg: 'ID de usuario inválido' });
        }

        const user = await User.findById(userId)
            .select('username email bio profilePicture friends friendRequests')
            .lean();

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        const isFriend = user.friends.includes(requesterId);

        const hasSentRequest = user.friendRequests.includes(requesterId);

        res.json({ 
            profile: user,
            isFriend,
            hasSentRequest
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};


exports.cancelFriendRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { friendId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(friendId)) {
            return res.status(400).json({ msg: 'ID de usuario inválido' });
        }

        if (userId === friendId) {
            return res.status(400).json({ msg: 'No puedes cancelar una solicitud de amistad a ti mismo' });
        }

        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        if (!friend.friendRequests.includes(userId)) {
            return res.status(400).json({ msg: 'No tienes una solicitud de amistad enviada a este usuario' });
        }

        friend.friendRequests = friend.friendRequests.filter(id => id.toString() !== userId);
        await friend.save();

        res.json({ msg: 'Solicitud de amistad cancelada exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getFriends = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId)
            .populate('friends', 'username email profilePicture')
            .select('friends');

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json({ friends: user.friends });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};


exports.acceptFriendRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { requestId } = req.body;

        if (userId === requestId) {
            return res.status(400).json({ msg: 'No puedes aceptar una solicitud de amistad de ti mismo' });
        }

        const [user, requester] = await Promise.all([
            User.findById(userId),
            User.findById(requestId)
        ]);

        if (!user || !requester) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        if (!user.friendRequests.includes(requestId)) {
            return res.status(400).json({ msg: 'No hay solicitud de amistad de este usuario' });
        }

        user.friendRequests.pull(requestId);
        user.friends.addToSet(requestId);
        requester.friends.addToSet(userId);

        await Promise.all([
            user.save(),
            requester.save()
        ]);

        res.json({ msg: 'Solicitud de amistad aceptada' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.addFavoriteTrip = async (req, res) => {
    try {
        const userId = req.userId;
        const { tripId } = req.body;

        const user = await User.findById(userId).select('friends favorites');
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        if (user.favorites.some(id => id.toString() === tripId)) {
            return res.status(400).json({ msg: 'El itinerario ya está en favoritos' });
        }

        const trip = await Trip.findOne({
            _id: tripId,
            $or: [
                { public: true },
                { createdBy: userId },
                { createdBy: { $in: user.friends } },
            ],
        });

        if (!trip) {
            return res.status(404).json({ msg: 'Itinerario no encontrado o no tienes acceso' });
        }

        user.favorites.addToSet(tripId);
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

        const user = await User.findById(userId).select('favorites');
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        if (!user.favorites.some(id => id.toString() === tripId)) {
            return res.status(400).json({ msg: 'El itinerario no está en favoritos' });
        }

        user.favorites = user.favorites.filter(id => id.toString() !== tripId);
        await user.save();

        res.json({ msg: 'Itinerario eliminado de favoritos' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// falta incluir paginación, ahora hay un apaño
exports.getFavoriteTrips = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 20 } = req.query;

        const user = await User.findById(userId)
            .populate({
                path: 'favorites',
                populate: { path: 'createdBy', select: 'username' },
                options: {
                    skip: (page - 1) * limit,
                    limit: parseInt(limit),
                }
            })
            .select('favorites');

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json({ favorites: user.favorites, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};


exports.getFriendTrips = async (req, res) => {
    try {
        const userId = req.userId;
        const { friendId } = req.params;

        if (userId === friendId) {
            return res.status(400).json({ msg: 'No puedes obtener tus propios viajes a través de esta ruta' });
        }

        const [user, friend] = await Promise.all([
            User.findById(userId).select('friends'),
            User.findById(friendId)
        ]);

        if (!user || !friend) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        if (!user.friends.some(id => id.toString() === friendId)) {
            return res.status(403).json({ msg: 'No eres amigo de este usuario' });
        }

        const trips = await Trip.find({
            createdBy: friendId,
            $or: [
                { public: true },
                { createdBy: userId }
            ]
        }).populate('createdBy', 'username profilePicture');

        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getFriendRequests = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 20 } = req.query;

        const user = await User.findById(userId)
            .populate({
                path: 'friendRequests',
                select: 'username email',
                options: {
                    skip: (page - 1) * limit,
                    limit: parseInt(limit),
                }
            })
            .select('friendRequests');

        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        res.json({ friendRequests: user.friendRequests, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.createCustomList = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.userId;
        let { name } = req.body;

        if (!name || !name.trim()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ msg: 'El nombre de la lista es requerido' });
        }

        name = name.trim();

        const user = await User.findById(userId).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        if (user.customLists.some(list => list.name.toLowerCase() === name.toLowerCase())) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ msg: 'Ya existe una lista con ese nombre' });
        }

        user.customLists.push({ name, trips: [] });
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({ msg: 'Lista personalizada creada exitosamente' });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.addTripToCustomList = async (req, res) => {
    try {
        const userId = req.userId;
        const { listId, tripId } = req.body;

        const user = await User.findById(userId).select('customLists friends favorites');
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        const customList = user.customLists.id(listId);
        if (!customList) {
            return res.status(404).json({ msg: 'Lista personalizada no encontrada' });
        }

        if (customList.trips.some(id => id.toString() === tripId)) {
            return res.status(400).json({ msg: 'El itinerario ya está en la lista' });
        }

        const trip = await Trip.findOne({
            _id: tripId,
            $or: [
                { public: true },
                { createdBy: userId },
                { createdBy: { $in: user.friends } },
            ],
        });

        if (!trip) {
            return res.status(404).json({ msg: 'Itinerario no encontrado o no tienes acceso' });
        }

        customList.trips.addToSet(tripId);
        await user.save();

        res.json({ msg: 'Itinerario agregado a la lista personalizada' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.removeTripFromCustomList = async (req, res) => {
    try {
        const userId = req.userId;
        const { listId, tripId } = req.body;

        const user = await User.findById(userId).select('customLists');
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        const customList = user.customLists.id(listId);
        if (!customList) {
            return res.status(404).json({ msg: 'Lista personalizada no encontrada' });
        }

        if (!customList.trips.some(id => id.toString() === tripId)) {
            return res.status(400).json({ msg: 'El itinerario no está en la lista' });
        }

        customList.trips = customList.trips.filter(id => id.toString() !== tripId);
        await user.save();

        res.json({ msg: 'Itinerario eliminado de la lista personalizada' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.deleteCustomList = async (req, res) => {
    try {
        const userId = req.userId;
        const { listId } = req.body;

        const user = await User.findById(userId).select('customLists');
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        const customList = user.customLists.id(listId);
        if (!customList) {
            return res.status(404).json({ msg: 'Lista personalizada no encontrada' });
        }

        customList.remove();
        await user.save();

        res.json({ msg: 'Lista personalizada eliminada exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getCustomLists = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId)
            .populate({
                path: 'customLists.trips',
                populate: { path: 'createdBy', select: 'username' },
                select: 'title description createdBy'
            })
            .select('customLists');

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json({ customLists: user.customLists });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.editCustomListName = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.userId;
        let { listId, newName } = req.body;

        if (!newName || !newName.trim()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ msg: 'El nuevo nombre de la lista es requerido' });
        }

        newName = newName.trim();

        const user = await User.findById(userId).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        const customList = user.customLists.id(listId);
        if (!customList) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ msg: 'Lista personalizada no encontrada' });
        }

        if (user.customLists.some(list => list.name.toLowerCase() === newName.toLowerCase() && list._id.toString() !== listId)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ msg: 'Ya existe una lista con ese nombre' });
        }

        customList.name = newName;
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({ msg: 'Nombre de la lista personalizado actualizado exitosamente' });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};


exports.getProfile = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId)
            .select('-password -friends -friendRequests -trips -paymentHistory -customLists')
            .populate({
                path: 'favorites',
                select: 'title description createdBy',
                populate: { path: 'createdBy', select: 'username' }
            });

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json({ profile: user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { username, bio } = req.body;

        const updateFields = {};

        if (username) {
            updateFields.username = username.trim();
        }
        if (bio) updateFields.bio = bio.trim();

        if (username || email) {
            const existingUser = await User.findOne({
                $or: [
                    { username: username ? username.trim() : undefined },
                    { email: email ? email.trim() : undefined }
                ],
                _id: { $ne: userId }
            });

            if (existingUser) {
                if (existingUser.username === username) {
                    return res.status(400).json({ msg: 'El nombre de usuario ya está en uso' });
                }
                if (existingUser.email === email) {
                    return res.status(400).json({ msg: 'El email ya está en uso' });
                }
            }
        }

        const user = await User.findByIdAndUpdate(userId, updateFields, { new: true, runValidators: true });

        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json({ msg: 'Perfil actualizado exitosamente', profile: user });
    } catch (err) {
        console.error(err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Error del servidor');
    }
};

exports.getRecommendations = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).select('interests travelPreferences');
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        const { interests, travelPreferences } = user;

        if (!travelPreferences || !travelPreferences.destinationPreferences || !travelPreferences.destinationPreferences.type) {
            return res.status(400).json({ msg: 'Preferencias de viaje incompletas' });
        }

        const filter = {
            public: true,
            interests: { $in: interests || [] },
            'destinationPreferences.type': travelPreferences.destinationPreferences.type,
        };

        const recommendedTrips = await Trip.find(filter)
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('createdBy', 'username');

        res.json({ recommendations: recommendedTrips });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};