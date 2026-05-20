const router = require('express').Router();
const svc = require('../services/diagnostico.service');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.get('/preguntas', svc.getPreguntas);
router.get('/ultimo', svc.getUltimo);
router.post('/', svc.guardar);

module.exports = router;
