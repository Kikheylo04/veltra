const router = require('express').Router();
const svc = require('../services/garantia.service');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/', svc.getAll);
router.get('/orden/:ordenId', svc.getByOrden);
router.post('/', svc.create);

module.exports = router;
