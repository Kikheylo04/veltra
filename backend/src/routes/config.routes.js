const router = require('express').Router();
const svc = require('../services/config.service');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', svc.getConfig);
router.put('/', requireRole('ADMIN'), svc.updateConfig);

module.exports = router;
