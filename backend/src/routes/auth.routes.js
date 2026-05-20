const router = require('express').Router();
const { login, cambiarPassword } = require('../services/auth.service');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.put('/password', authMiddleware, cambiarPassword);

module.exports = router;
