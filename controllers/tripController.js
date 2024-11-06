const Trip = require('../models/Trip');
const User = require('../models/User');

exports.getCivitatisActivities = require('../utils/fetchCivitatisActivities');

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
        const trips = await Trip.find({ createdBy: userId });
        res.json(trips);
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
