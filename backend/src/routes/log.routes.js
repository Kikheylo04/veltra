const router = require('express').Router();
const svc = require('../services/log.service');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', requireRole('ADMIN'), svc.getAll);

module.exports = router;
