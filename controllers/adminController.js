const User = require('../models/User');
const Trip = require('../models/Trip');

exports.getDashboard = async (req, res) => {
    res.json({ msg: 'Bienvenido al panel de administración' });
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        await User.findByIdAndDelete(userId);
        res.json({ msg: 'Usuario eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

// faltan agregar muchas funciones