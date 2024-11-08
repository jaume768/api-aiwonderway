const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;

        const user = await User.findById(req.userId);
        req.userRole = user.role;

        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token no válido' });
    }
};