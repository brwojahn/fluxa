const express = require('express');
const controller = require('../controllers/amostrasController');
const { autenticar, autorizar } = require('../middleware/autenticacao');

const router = express.Router();

router.use(autenticar);
router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.post('/', autorizar('administrador', 'funcionario'), controller.criar);
router.put('/:id', autorizar('administrador', 'funcionario'), controller.atualizar);
router.delete('/:id', autorizar('administrador'), controller.remover);

module.exports = router;
