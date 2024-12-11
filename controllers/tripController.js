const Trip = require('../models/Trip');
const User = require('../models/User');
const generateTripPDF = require('../utils/generatePDF');

exports.getCivitatisActivities = require('../utils/fetchCivitatisActivities');

exports.getTripById = async (req, res) => {
    try {
        const { tripId } = req.params;
        
        let userId = null;
        const token = req.header('x-auth-token');
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId;
            } catch (err) {
                userId = null;
            }
        }

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
      const fixedTripIds = [
        '6759755fe5c0f98ac7bb473e',
        '675975f0e5c0f98ac7bb47ce',
        '67597890b8de5bcb3cbda7b8',
        '672b5f9f738b465e87669352',
        '672b5fd2738b465e87669356',
        '672b60ee738b465e8766935a',
        '675976a0e5c0f98ac7bb49b2',
        '674454eed122ff7227898f9a',
        '67597720e5c0f98ac7bb4b11',
        '67597801e5c0f98ac7bb4c60'
      ];
  
      const tripLinks = {
        '6759755fe5c0f98ac7bb473e': 'https://img.rtve.es/imagenes/alpes-suizos-viajar-visitar/1639070122354.jpg',
        '675975f0e5c0f98ac7bb47ce': 'https://media.istockphoto.com/id/1390815938/es/foto/ciudad-de-tokio-en-japón.jpg?s=612x612&w=0&k=20&c=Vf3r1Qf3h-wRyrxOiZQBpZpzxjT3G3sLypwmbqgQxtU=',
        '67597890b8de5bcb3cbda7b8': 'https://entremontanas.com/wp-content/uploads/Vietnam-1.jpg',
        '672b5f9f738b465e87669352': 'https://media.istockphoto.com/id/539115110/es/foto/colosseum-in-rome-italy-y-sol-de-la-ma%C3%B1ana.jpg?s=612x612&w=0&k=20&c=S2BE7bvASd4hm6Yp0VbtvaGnnqTR4p5HJ-6RfDjR-MQ=',
        '672b5fd2738b465e87669356': 'https://viajes.nationalgeographic.com.es/medio/2017/02/09/shutterstock-302415089_6b607cdb.jpg',
        '672b60ee738b465e8766935a': 'https://www.civitatis.com/f/pseo/espana/madrid/gran-via-noche-madrid-1200.jpg',
        '675976a0e5c0f98ac7bb49b2': 'https://www.keralaviajes.com/blog/wp-content/uploads/2020/03/koh-tao-tailandia.jpg',
        '674454eed122ff7227898f9a': 'https://a.travel-assets.com/findyours-php/viewfinder/images/res70/52000/52309-Seville.jpg',
        '67597720e5c0f98ac7bb4b11': 'https://fotografias.larazon.es/clipping/cmsimages01/2022/12/22/DECA45C8-F887-447C-820A-889D821FC7AD/98.jpg?crop=4800,2701,x0,y250&width=1900&height=1069&optimize=low&format=webply',
        '67597801e5c0f98ac7bb4c60': 'https://cms.w2m.com/.imaging/fullHd/Sites/Flowo/imagenes-blog/blog/cancun-o-riviera-maya-cual-es-mejor.jpg'
      };
  
      let trips = await Trip.find({ _id: { $in: fixedTripIds } });
  
      trips = trips.map(trip => {
        const link = tripLinks[trip._id.toString()];
        if (link) {
          return {
            ...trip.toObject(),
            link
          };
        }
        return trip;
      });
  
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