const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendVerificationEmail = require('../utils/sendVerificationEmail');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'El usuario ya existe' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(32).toString('hex');

        user = new User({
            username,
            email,
            password: hashedPassword,
            isVerified: false,
            verificationToken
        });

        await user.save();

        const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}&email=${email}`;
        await sendVerificationEmail(email, username, verificationLink);

        res.json({ msg: 'Registro exitoso. Por favor, verifica tu correo electrónico.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Credenciales inválidas' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Credenciales inválidas' });

        if (!user.isVerified) {
            return res.status(400).json({ msg: 'Cuenta no verificada. Por favor, revisa tu correo.' });
        }

        const payload = { userId: user._id };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token, email } = req.query;
        const user = await User.findOne({ email, verificationToken: token });

        if (!user) {
            return res.status(400).json({ msg: 'Token de verificación inválido o usuario no encontrado' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({ msg: 'Cuenta verificada exitosamente. Ya puedes iniciar sesión.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error del servidor');
    }
};