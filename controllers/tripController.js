const Trip = require('../models/Trip');
const User = require('../models/User');
const generateTripPDF = require('../utils/generatePDF');
const jwt = require('jsonwebtoken');
const { cloudinary, storage } = require('../utils/cloudinary');
exports.getCivitatisActivities = require('../utils/fetchCivitatisActivities');

exports.uploadTripImage = async (req, res) => {
    try {
        const { tripId } = req.params;
        const userId = req.userId;

        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ msg: 'Itinerario no encontrado' });
        }

        const isCreator = trip.createdBy.toString() === userId;
        const isCollaborator = trip.collaborators.some(
            (collab) => collab.toString() === userId
        );

        if (!isCreator && !isCollaborator) {
            return res.status(403).json({ msg: 'No tienes permiso para editar este itinerario' });
        }

        if (!req.file) {
            return res.status(400).json({ msg: 'No se ha proporcionado ninguna imagen' });
        }

        const result = await cloudinary.uploader.upload_stream(
            { folder: 'itinerarios' },
            async (error, result) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ msg: 'Error al subir la imagen' });
                }

                trip.imageUrl = result.secure_url;
                await trip.save();

                res.json({ msg: 'Imagen subida exitosamente', imageUrl: result.secure_url });
            }
        );

        result.end(req.file.buffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

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
                console.log(err);
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
        '676e9a7360ce0657009af9fd',
        '676ea1aabcdadc60ab52bae4',
        '676ea354bcdadc60ab52bb3a',
        '676ea41cbcdadc60ab52bb56',
        '676ea4c1bcdadc60ab52bb68',
        '676ea5b9bcdadc60ab52bc04',
        '676ea689bcdadc60ab52beea',
        '676ea790bcdadc60ab52c067',
        '676ea87cbcdadc60ab52c2d3',
        '676ea920bcdadc60ab52c6b3'
      ];
  
      const tripLinks = {
        '676e9a7360ce0657009af9fd': 'https://media.istockphoto.com/id/539115110/es/foto/colosseum-in-rome-italy-y-sol-de-la-ma%C3%B1ana.jpg?s=612x612&w=0&k=20&c=S2BE7bvASd4hm6Yp0VbtvaGnnqTR4p5HJ-6RfDjR-MQ=',
        '676ea1aabcdadc60ab52bae4': 'https://media.istockphoto.com/id/1132919653/es/foto/estocolmo-suecia-vista-panor%C3%A1mica-del-atardecer-de-verano-con-el-colorido-cielo-de-la.jpg?s=612x612&w=0&k=20&c=UQy3YSXxIc_Z2VTLwuRkxdjK_JXU3bALcm-wxx6HU24=',
        '676ea354bcdadc60ab52bb3a': 'https://res.cloudinary.com/hello-tickets/image/upload/c_limit,f_auto,q_auto,w_1300/v1684589947/jqt6vclfpnn2ypd6drhd.jpg',
        '676ea41cbcdadc60ab52bb56': 'https://i0.wp.com/ventureandpleasure.com/wp-content/uploads/2023/05/ciudades-de-tailandia-scaled.jpg?fit=2560%2C1707&ssl=1',
        '676ea4c1bcdadc60ab52bb68': 'https://huttohuthikingswitzerland.b-cdn.net/wp-content/uploads/Spectacular-principal-street-of-Lauterbrunnen-with-shops-hotels-terraces-swiss-flags-and-stunning-Staubbach-waterfall-in-background.webp',
        '676ea5b9bcdadc60ab52bc04': 'https://cdn5.travelconline.com/images/fit-in/2000x0/filters:quality(75):strip_metadata():format(webp)/https%3A%2F%2Ftr2storage.blob.core.windows.net%2Fimagenes%2FnIoLCK5zpYF6-chC14sr9qfjpeg.jpeg',
        '676ea689bcdadc60ab52beea': 'https://content.r9cdn.net/rimg/dimg/17/74/0ca6e469-city-30651-1632b88f203.jpg?width=1366&height=768&xhint=2635&yhint=1507&crop=true',
        '676ea790bcdadc60ab52c067': 'https://viajes.nationalgeographic.com.es/medio/2024/10/31/ciudad-del-cabo_b430dc73_682284814_241031131744_1280x824.webp',
        '676ea87cbcdadc60ab52c2d3': 'https://www.barcelo.com/guia-turismo/wp-content/uploads/que-visitar-en-praga.jpg',
        '676ea920bcdadc60ab52c6b3': 'https://images.gostudy.com.au/w:1400/h:800/q:mauto/f:best/ig:avif/id:1619b76004c98e623b2e00397e8e6d0a/https://gostudyaus.es/SYD_header.jpg'
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