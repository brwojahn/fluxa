const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Fluxa: servidor em preparação.'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor Fluxa iniciando em http://localhost:${PORT}`);
});
