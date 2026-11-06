# Fluxa

Sistema web para organizar e rastrear amostras comerciais de café verde. Esta etapa implementa a estrutura relacional MySQL, cadastro e login de usuários, autenticação JWT e autorização por perfil.

## Tecnologias

- API: Node.js e Express
- Banco de dados: MySQL
- Senhas: bcryptjs
- Tokens: JSON Web Token (JWT)

## Estrutura

```text
backend/
  controllers/   Regras de autenticação e usuários
  database/      Pool e conexão com MySQL
  middleware/    CORS, autenticação e autorização
  routes/        Rotas da API
  utils/         Carregamento de ambiente e erros HTTP
sql/schema.sql   Criação do banco e das tabelas
```

O banco `fluxa` contém as tabelas `perfis`, `usuarios`, `fornecedores`, `clientes`, `amostras` e `envios`, com chaves primárias, restrições únicas, índices e chaves estrangeiras. As tabelas de amostras e envios permitem manter o histórico; envios apontam para a amostra, o cliente e o funcionário responsável.

## Configuração

1. Crie o banco e as tabelas executando `sql/schema.sql` no MySQL. O script cria o banco `fluxa` se ele ainda não existir.
2. Copie `backend/.env.example` para `backend/.env` e informe as credenciais do MySQL.
3. Defina `JWT_SECRET` como uma chave aleatória com no mínimo 32 caracteres. Não use a mesma chave em produção e não versione o arquivo `.env`.
4. Instale e inicie o backend:

```bash
cd backend
npm install
npm start
```

A API fica disponível em `http://localhost:3000`. Ela inicia mesmo se o MySQL estiver indisponível; as rotas que acessam o banco responderão com erro até que a conexão esteja ativa.

## Endpoints

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/api/health` | Público | Verifica a API |
| GET | `/api/health/database` | Público | Verifica a conexão MySQL |
| POST | `/api/auth/register` | Público | Cadastra usuário; o primeiro recebe perfil administrador e os demais, funcionário |
| POST | `/api/auth/login` | Público | Valida credenciais e retorna JWT |
| GET | `/api/auth/me` | JWT | Retorna o usuário autenticado |
| GET | `/api/usuarios` | Administrador | Lista usuários |
| POST | `/api/usuarios` | Administrador | Cadastra funcionário ou administrador |
| PATCH | `/api/usuarios/:id/perfil` | Administrador | Altera o perfil de um usuário |
| PATCH | `/api/usuarios/:id/status` | Administrador | Ativa ou desativa um usuário |

### Cadastro inicial

O primeiro cadastro deve ser feito após executar o esquema SQL. Ele recebe o perfil de administrador; cadastros públicos posteriores recebem o perfil de funcionário. O cadastro inicial é serializado no MySQL para evitar que duas requisições concorrentes criem mais de um administrador inicial.

```json
{
  "nome": "Ana Silva",
  "email": "ana@empresa.com",
  "senha": "uma-senha-segura"
}
```

O cadastro e o login retornam `{ "usuario": ..., "token": "..." }`. Envie o token para rotas protegidas no cabeçalho:

```text
Authorization: Bearer <token>
```

Senhas precisam ter pelo menos oito caracteres e são armazenadas como hash bcrypt. O JWT expira em oito horas por padrão; isso pode ser alterado com `JWT_EXPIRES_IN`. O middleware consulta o usuário no banco a cada requisição protegida, então usuários desativados perdem o acesso imediatamente.

## Perfis

- **administrador**: pode consultar usuários, criar usuários e alterar perfil ou status.
- **funcionario**: pode autenticar-se e consultar o próprio perfil. As demais permissões serão aplicadas quando os módulos operacionais forem implementados.

## Configuração do ambiente

Veja `backend/.env.example` para as variáveis `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN` e `FRONTEND_ORIGIN`. O nome padrão do banco é `fluxa`.
