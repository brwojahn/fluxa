const express = require('express');
const { registrar, login, perfilAtual } = require('../controllers/authController');
const { autenticar } = require('../middleware/autenticacao');

const router = express.Router();

router.post('/register', registrar);
router.post('/login', login);
router.get('/me', autenticar, perfilAtual);

module.exports = router;
