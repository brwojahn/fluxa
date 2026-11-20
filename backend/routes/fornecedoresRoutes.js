const express = require('express');
const controller = require('../controllers/fornecedoresController');
const { autenticar, autorizar } = require('../middleware/autenticacao');

const router = express.Router();
router.use(autenticar);
router.get('/', controller.listar);
router.post('/', autorizar('administrador'), controller.criar);
router.put('/:id', autorizar('administrador'), controller.atualizar);
router.delete('/:id', autorizar('administrador'), controller.remover);

module.exports = router;
