const express = require('express');
const controller = require('../controllers/enviosController');
const { autenticar, autorizar } = require('../middleware/autenticacao');

const router = express.Router();
router.use(autenticar);
router.get('/', controller.listar);
router.post('/', autorizar('administrador', 'funcionario'), controller.criar);

module.exports = router;
