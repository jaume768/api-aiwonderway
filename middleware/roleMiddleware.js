module.exports = function (requiredRole) {
    return function (req, res, next) {
        const userRole = req.userRole;

        const rolesHierarchy = {
            free: 1,
            premium: 2,
            pro: 3,
            vip: 4,
            admin: 5,
        };

        if (rolesHierarchy[userRole] >= rolesHierarchy[requiredRole]) {
            next();
        } else {
            return res.status(403).json({ msg: 'No tienes permiso para acceder a este recurso' });
        }
    };
};