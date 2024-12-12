const express = require('express');
const router = express.Router();
const passport = require('passport'); // Este 'require' apuntará al mismo passport ya configurado
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify', authController.verifyEmail);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/auth/login-failed' }),
    (req, res) => {
        const user = req.user;
        const payload = { userId: user._id };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) {
                console.error(err);
                return res.redirect('/auth/login-failed');
            }
            res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
        });
    }
);

router.get('/login-failed', (req, res) => {
    res.send('Error al iniciar sesión con Google');
});

module.exports = router;