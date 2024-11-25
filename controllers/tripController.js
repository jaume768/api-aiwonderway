const Trip = require('../models/Trip');
const User = require('../models/User');
const generateTripPDF = require('../utils/generatePDF');

exports.getCivitatisActivities = require('../utils/fetchCivitatisActivities');

exports.getTripById = async (req, res) => {
    try {
        const { tripId } = req.params;
        const userId = req.userId;

        const trip = await Trip.findById(tripId)
            .populate('createdBy', 'username')
            .populate('collaborators', 'username')
            .populate({
                path: 'reviews',
                populate: { path: 'user', select: 'username' },
            })
            .populate({
                path: 'comments',
                populate: { path: 'user', select: 'username' },
            });

        if (!trip) {
            return res.status(404).json({ msg: 'Itinerario no encontrado' });
        }

        if (!trip.public) {
            if (!userId) {
                return res.status(401).json({ msg: 'Acceso no autorizado' });
            }
            const isCreator = trip.createdBy._id.toString() === userId;
            const isCollaborator = trip.collaborators.some(
                (collaborator) => collaborator._id.toString() === userId
            );

            if (!isCreator && !isCollaborator) {
                return res.status(403).json({ msg: 'No tienes permiso para ver este itinerario' });
            }
        }

        res.json(trip);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getPopularTrips = async (req, res) => {
    try {
        const trips = await Trip.find({ public: true }).sort({ createdAt: -1 }).limit(10);
        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.searchTrips = async (req, res) => {
    try {
        const { query } = req.body;
        const trips = await Trip.find({ public: true, $text: { $search: query } });
        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getUserTrips = async (req, res) => {
    try {
        const userId = req.userId;
        const trips = await Trip.find({
            $or: [
                { createdBy: userId },
                { collaborators: userId }
            ]
        }).populate('createdBy', 'username').populate('collaborators', 'username');

        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.deleteTrip = async (req, res) => {
    try {
        const userId = req.userId;
        const { tripId } = req.params;

        const trip = await Trip.findById(tripId);

        if (!trip) {
            return res.status(404).json({ msg: 'Itinerario no encontrado' });
        }

        if (trip.createdBy.toString() !== userId) {
            return res.status(403).json({ msg: 'No tienes permiso para eliminar este itinerario' });
        }

        await Trip.findByIdAndDelete(tripId);

        res.json({ msg: 'Itinerario eliminado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.getTripsBySpecifications = async (req, res) => {
    try {
        const userId = req.userId;
        const { specifications } = req.body;

        let query = { public: true };
        if (specifications) {
            query.$text = { $search: specifications };
        }

        let trips = await Trip.find(query).populate('createdBy', 'username');

        const user = await User.findById(userId);
        const friendsTrips = await Trip.find({
            createdBy: { $in: user.friends },
            public: false,
            $text: { $search: specifications },
        }).populate('createdBy', 'username');

        trips = trips.concat(friendsTrips);

        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.downloadTrip = async (req, res) => {
    try {
        const userId = req.userId;
        const { tripId } = req.params;

        const user = await User.findById(userId);

        if (user.role === 'user') {
            return res.status(403).json({ msg: 'Esta funcionalidad está disponible solo para usuarios premium, pro o vip' });
        }

        const trip = await Trip.findById(tripId);

        if (!trip) {
            return res.status(404).json({ msg: 'Itinerario no encontrado' });
        }

        if (trip.createdBy.toString() !== userId && !trip.collaborators.includes(userId)) {
            return res.status(403).json({ msg: 'No tienes permiso para descargar este itinerario' });
        }

        generateTripPDF(trip, (filePath) => {
            res.download(filePath, `${trip.title}.pdf`, (err) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error al descargar el archivo');
                }
                fs.unlinkSync(filePath);
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.updateTrip = async (req, res) => {
    try {
        const userId = req.userId;
        const { tripId } = req.params;
        const updateData = req.body;

        const trip = await Trip.findById(tripId);

        if (!trip) {
            return res.status(404).json({ msg: 'Itinerario no encontrado' });
        }

        const isCreator = trip.createdBy.toString() === userId;
        const isCollaborator = trip.collaborators.includes(userId);

        if (!isCreator && !isCollaborator) {
            return res.status(403).json({ msg: 'No tienes permiso para editar este itinerario' });
        }

        const creatorOnlyFields = ['createdBy', 'collaborators', 'public'];

        if (!isCreator) {
            creatorOnlyFields.forEach(field => {
                if (field in updateData) {
                    delete updateData[field];
                }
            });
        }

        Object.assign(trip, updateData);

        await trip.save();

        res.json({ msg: 'Itinerario actualizado exitosamente', trip });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.shareTrip = async (req, res) => {
    try {
        const userId = req.userId;
        const { tripId, collaboratorId } = req.body;

        const trip = await Trip.findById(tripId);

        if (!trip) {
            return res.status(404).json({ msg: 'Itinerario no encontrado' });
        }

        if (trip.createdBy.toString() !== userId) {
            return res.status(403).json({ msg: 'No tienes permiso para agregar colaboradores a este itinerario' });
        }

        if (trip.collaborators.includes(collaboratorId)) {
            return res.status(400).json({ msg: 'El usuario ya es colaborador' });
        }

        trip.collaborators.push(collaboratorId);
        await trip.save();

        res.json({ msg: 'Colaborador agregado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.removeCollaborator = async (req, res) => {
    try {
        const userId = req.userId;
        const { tripId, collaboratorId } = req.body;

        const trip = await Trip.findById(tripId);

        if (!trip) {
            return res.status(404).json({ msg: 'Itinerario no encontrado' });
        }

        if (trip.createdBy.toString() !== userId) {
            return res.status(403).json({ msg: 'No tienes permiso para eliminar colaboradores de este itinerario' });
        }

        if (!trip.collaborators.includes(collaboratorId)) {
            return res.status(400).json({ msg: 'El usuario no es colaborador' });
        }

        trip.collaborators = trip.collaborators.filter(id => id.toString() !== collaboratorId);
        await trip.save();

        res.json({ msg: 'Colaborador eliminado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// faltan endpoints para que el usuario pueda ver los intinerarios a los que es colaborador
// faltan endpoints para hacer que solo el creador pueda editar y eliminar el intinerario, añadir y eliminar colaboradores y que los colaboradores también puedan editar el trip pero no eliminarlo