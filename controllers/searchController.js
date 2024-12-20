const Trip = require('../models/Trip');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.search = async (req, res) => {
    try {
        const q = req.query.q || '';
        const trimmedQuery = q.trim();

        if (trimmedQuery.length < 3) {
            return res.json([]);
        }

        const tripsByTitle = await Trip.find({
            title: { $regex: trimmedQuery, $options: 'i' },
            public: true
        }).populate('createdBy', 'username');

        const users = await User.find({
            username: { $regex: trimmedQuery, $options: 'i' }
        }).select('_id');

        const userIds = users.map(u => u._id);

        let tripsByUser = [];
        if (userIds.length > 0) {
            tripsByUser = await Trip.find({
                createdBy: { $in: userIds },
                public: true
            }).populate('createdBy', 'username');
        }

        const allTrips = [...tripsByTitle, ...tripsByUser];

        const uniqueTrips = [];
        const seen = new Set();
        for (const trip of allTrips) {
            if (!seen.has(trip._id.toString())) {
                seen.add(trip._id.toString());
                uniqueTrips.push(trip);
            }
        }

        res.json(uniqueTrips);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};