# Fluxa

Sistema web para organizar e rastrear amostras comerciais de café verde. O sistema reúne recebimentos, inventário e envios, substituindo controles dispersos em planilhas.

## Tecnologias

- Front-end: HTML, CSS e JavaScript com Fetch e manipulação do DOM
- Back-end: Node.js 18 ou superior e Express
- Banco de dados: MySQL 8.0.16 ou superior
- Senhas: bcryptjs
- Autenticação: JWT

## Estrutura

```text
backend/
  controllers/   Regras de autenticação, usuários, amostras, fornecedores, clientes e envios
  database/      Pool e conexão MySQL
  middleware/    CORS, autenticação e autorização
  routes/        Rotas da API
  utils/         Leitura de ambiente e erros HTTP
frontend/        Login, cadastros, inventário, envios e indicadores
sql/schema.sql   Criação do banco, tabelas e relacionamentos
sql/seed.sql     Dados fictícios opcionais para desenvolvimento
```

## Banco de dados

O banco `fluxa` contém `perfis`, `usuarios`, `fornecedores`, `clientes`, `amostras` e `envios`. O esquema define chaves primárias e estrangeiras, índices e restrições. Envios mantêm o histórico relacionado à amostra, cliente e responsável. Use MySQL 8.0.16 ou superior para aplicar também as restrições `CHECK` de quantidade positiva.

`sql/seed.sql` insere fornecedores, clientes, amostras e um envio fictícios para demonstração. Execute-o depois de `sql/schema.sql`. Ele não cria usuários: cadastre a primeira conta pela API para gerar o hash da senha.

## Instalação e execução

1. Execute `sql/schema.sql` no MySQL para criar o banco e as tabelas. Opcionalmente, execute `sql/seed.sql` para inserir dados de demonstração.
2. Copie `backend/.env.example` para `backend/.env`. Configure o acesso ao MySQL e defina `JWT_SECRET` como uma chave aleatória com pelo menos 32 caracteres.
3. Instale dependências e inicie a API:

```bash
cd backend
npm install
npm start
```

4. Sirva a pasta `frontend` por um servidor local, como a extensão Live Server do VS Code. A URL padrão da API é `http://localhost:3000/api`. Pode-se definir `window.FLUXA_API_URL` antes de `script.js` para alterar essa URL.
5. Acesse a interface e crie a primeira conta, que receberá o perfil de administrador. Cadastre fornecedores e clientes para começar a registrar amostras e envios.

`GET /api/health` verifica se a API está ativa e `GET /api/health/database` verifica a conexão MySQL. Não envie `backend/.env`, senhas ou tokens ao GitHub.

## Endpoints

Rotas protegidas exigem `Authorization: Bearer <token>`.

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| GET | `/api/health` | Público | Verifica a API |
| GET | `/api/health/database` | Público | Verifica a conexão com MySQL |
| POST | `/api/auth/register` | Público | Cadastra conta; o primeiro usuário é administrador |
| POST | `/api/auth/login` | Público | Login e emissão do JWT |
| GET | `/api/auth/me` | JWT | Consulta o usuário autenticado |
| GET | `/api/usuarios` | Administrador | Lista usuários |
| POST | `/api/usuarios` | Administrador | Cria usuário |
| PATCH | `/api/usuarios/:id/perfil` | Administrador | Altera o perfil |
| PATCH | `/api/usuarios/:id/status` | Administrador | Ativa ou desativa uma conta |
| GET | `/api/fornecedores` | JWT | Lista fornecedores |
| POST | `/api/fornecedores` | Administrador | Cadastra fornecedor |
| PUT | `/api/fornecedores/:id` | Administrador | Atualiza fornecedor |
| DELETE | `/api/fornecedores/:id` | Administrador | Exclui fornecedor sem amostras relacionadas |
| GET | `/api/clientes` | JWT | Lista clientes |
| POST | `/api/clientes` | Administrador | Cadastra cliente |
| PUT | `/api/clientes/:id` | Administrador | Atualiza cliente |
| DELETE | `/api/clientes/:id` | Administrador | Exclui cliente sem envios relacionados |
| GET | `/api/amostras` | JWT | Lista amostras e estoque disponível; aceita filtros |
| GET | `/api/amostras/:id` | JWT | Consulta amostra |
| POST | `/api/amostras` | Administrador ou funcionário | Registra recebimento |
| PUT | `/api/amostras/:id` | Administrador ou funcionário | Atualiza amostra |
| DELETE | `/api/amostras/:id` | Administrador | Exclui amostra sem envios relacionados |
| GET | `/api/envios` | JWT | Consulta histórico; aceita filtros |
| POST | `/api/envios` | Administrador ou funcionário | Registra envio |
| GET | `/api/indicadores` | JWT | Totais de estoque e envios recentes |

## Regras e permissões

- Administradores podem criar e manter usuários, fornecedores e clientes, além de executar todas as operações de amostras.
- Funcionários autenticados podem consultar cadastros, registrar e atualizar amostras e registrar envios.
- Exclusões de cadastros relacionados a movimentos são bloqueadas para preservar o histórico.
- O estoque disponível é calculado subtraindo todos os envios da quantidade recebida.
- O registro de envio bloqueia a linha da amostra e verifica o saldo dentro de uma transação, prevenindo envio acima do estoque em requisições concorrentes.
- A quantidade recebida não pode ser reduzida abaixo da soma já enviada. Quantidades devem ser positivas e ter até três casas decimais.
- O front-end permite filtrar inventário e histórico de envios, exportar o inventário filtrado para CSV e imprimir/salvar o relatório como PDF pelo navegador.
- Senhas são armazenadas como hash bcrypt. JWT expira em oito horas por padrão (`JWT_EXPIRES_IN` altera o período). O usuário é consultado no banco em cada requisição protegida, então contas desativadas perdem acesso imediatamente.

## Entrega final

Antes da apresentação, instalar dependências e atualizar o `package-lock.json` com `npm install`, executar a aplicação ponta a ponta com MySQL e conferir os fluxos de login, permissões, recebimento, estoque e envio. Atualizar este README com os passos de teste confirmados. A apresentação deve explicar o problema, usuários, arquitetura, banco, autenticação, permissões, CRUD, regras de negócio e demonstrar o sistema funcionando.
