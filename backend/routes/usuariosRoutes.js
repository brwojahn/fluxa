const express = require('express');
const controller = require('../controllers/usuariosController');
const { autenticar, autorizar } = require('../middleware/autenticacao');

const router = express.Router();
router.use(autenticar, autorizar('administrador'));
router.get('/', controller.listar);
router.post('/', controller.criar);
router.patch('/:id/perfil', controller.alterarPerfil);
router.patch('/:id/status', controller.alterarStatus);

module.exports = router;
