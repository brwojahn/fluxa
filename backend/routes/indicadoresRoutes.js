const express = require('express');
const { consultar } = require('../controllers/indicadoresController');
const { autenticar } = require('../middleware/autenticacao');

const router = express.Router();
router.get('/', autenticar, consultar);

module.exports = router;
