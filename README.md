# Fluxa

## Descrição geral
A Fluxa é um sistema web para gerenciar e rastrear amostras comerciais de café verde, um produto básico negociado no mercado internacional. A proposta é centralizar informações que hoje costumam ser registradas em planilhas, facilitando a organização, a consulta e o controle das movimentações de amostras recebidas e enviadas.

O sistema será desenvolvido para atender uma empresa comercial que recebe, armazena, identifica, consulta e envia amostras de café verde a clientes. A plataforma pretende facilitar a organização dos registros e a consulta ao histórico das operações, mantendo uma estrutura adequada ao contexto acadêmico de um projeto de desenvolvimento web.

## Problema identificado
O controle manual de amostras por meio de planilhas pode dificultar a localização de itens armazenados, a consulta de amostras enviadas, a identificação de referências associadas aos envios e o controle das quantidades disponíveis. Além disso, quando os registros são mantidos em arquivos separados, a busca por fornecedor, cliente, classificação, data de recebimento ou período pode se tornar lenta e sujeita a erros.

Esses desafios reforçam a necessidade de um sistema centralizado que organize os dados com clareza, mantenha um histórico confiável das movimentações e facilite consultas e relatórios.

## Contextualização e justificativa
A rastreabilidade é importante para acompanhar materiais em uma cadeia comercial. No caso do café verde, o registro de cada amostra e de cada movimentação pode contribuir para a organização das operações, a consulta de informações e a comunicação com clientes e fornecedores.

O uso de planilhas isoladas pode dificultar a confiabilidade dos registros e o acesso rápido aos dados. A Fluxa propõe reunir essas informações em uma aplicação web organizada, preparada para oferecer consultas com diferentes filtros e facilitar o controle das operações.

## Objetivo geral
Desenvolver uma solução web para registrar, consultar e acompanhar amostras de café verde, promovendo organização, rastreabilidade e melhor visibilidade das movimentações relacionadas ao processo comercial.

## Objetivos específicos
- Organizar o cadastro de amostras recebidas.
- Registrar movimentações de envio para clientes.
- Consultar amostras disponíveis no inventário.
- Manter o histórico de entradas e saídas.
- Estruturar filtros para consultas por fornecedor, cliente, classificação, data e localização.
- Preparar o sistema para futuras exportações e relatórios.
- Definir a arquitetura inicial do sistema, separando a interface, o servidor e o banco de dados.

## Público-alvo
O sistema é direcionado a empresas comerciais que trabalham com café verde e precisam controlar amostras recebidas, armazenadas e enviadas a clientes. Também poderá ser utilizado por equipes internas responsáveis por operações de recebimento, envio e consulta de informações sobre inventário e rastreabilidade.

## Proposta de solução
A Fluxa propõe substituir ou aprimorar o controle feito em planilhas por uma aplicação web organizada em módulos. O sistema será planejado para registrar amostras recebidas, controlar envios, consultar o inventário e os registros gerais, além de manter uma base de dados centralizada para consultas e relatórios futuros.

A solução será organizada em camadas, com interface em HTML, CSS e JavaScript, servidor em Node.js com Express e banco de dados relacional MySQL, seguindo uma arquitetura de API REST.

## Funcionalidades planejadas
### 1. Recebimento de amostras
Módulo responsável pelo registro de novas amostras recebidas. Entre os campos previstos estão:
- Código interno da amostra;
- Código e identificação do fornecedor;
- Classificação comercial informada pelo fornecedor;
- Data de recebimento;
- Quantidade recebida;
- Localização de armazenamento;
- Observações relevantes.

O formato de identificação planejado é [CODIGO_FORNECEDOR]-[CODIGO_AMOSTRA]. Por exemplo, para um fornecedor 001 e duas amostras, podem existir os códigos 001-1 e 001-2. A classificação comercial não deve ser confundida com o código interno da amostra.

### 2. Registro de envios
Módulo responsável pelo registro de amostras enviadas a clientes. Os principais campos previstos são:
- Código da amostra enviada;
- Cliente destinatário;
- País de destino;
- Data do envio;
- Quantidade enviada;
- Funcionário responsável;
- Referência correspondente, quando existir;
- Observações.

A referência será opcional e o registro do envio não deverá apagar o histórico da amostra. O sistema deverá recalcular a quantidade disponível conforme as regras de negócio.

### 3. Inventário
Módulo para consultar as amostras que permanecem armazenadas, suas quantidades disponíveis, localização e situação atual.

### 4. Base de dados e relatórios
Módulo central para consultar os registros de amostras e movimentações. Os filtros previstos incluem:
- Código da amostra;
- Código ou nome do fornecedor;
- Cliente destinatário;
- Situação da amostra;
- Classificação comercial;
- Data de recebimento;
- Data de envio;
- Localização;
- Existência de referência;
- Responsável pelo registro.

Em etapas futuras, o sistema deverá permitir exportar os resultados filtrados ou os registros completos para Excel, CSV e PDF.

### 5. Fornecedores
Cadastro e consulta de fornecedores com códigos internos estáveis.

### 6. Clientes
Cadastro e consulta de clientes.

### 7. Painel de indicadores
Painel que poderá apresentar:
- Total de amostras registradas;
- Amostras disponíveis;
- Amostras enviadas;
- Amostras esgotadas;
- Envios recentes.

### 8. Usuários
Gerenciamento de usuários e permissões de acesso.

## Perfis de usuário e permissões previstas
### Administrador
- Acesso geral ao sistema;
- Gerenciamento de usuários;
- Consulta de registros;
- Gerenciamento de fornecedores e clientes;
- Acesso aos relatórios;
- Permissão para administrar os registros.

### Funcionário
- Registro de novas amostras;
- Consulta do inventário;
- Registro de envios;
- Consulta das informações necessárias às operações;
- Acesso às pesquisas permitidas.

Esses perfis constituem uma proposta inicial e serão implementados em etapas futuras. Nesta primeira entrega, não há autenticação nem controle de permissões.

## Fluxo básico de funcionamento
1. Uma amostra de café verde chega à empresa.
2. Um funcionário registra a amostra pelo módulo de recebimento.
3. Futuramente, o sistema atribuirá um código interno único à amostra.
4. A amostra ficará registrada no inventário.
5. Quando ocorrer um envio, o funcionário registrará a operação pelo módulo de envios.
6. O registro poderá incluir uma referência correspondente ou permanecer sem referência.
7. O sistema deverá manter o histórico e atualizar a quantidade disponível conforme as regras de negócio.
8. Os usuários poderão consultar amostras e envios por meio de filtros.
9. Em etapas futuras, os registros poderão ser exportados em relatórios.

## Tecnologias planejadas
- Interface: HTML, CSS e JavaScript.
- Servidor: Node.js e Express.
- Banco de dados: MySQL.
- API REST.
- Integração entre a interface e o servidor por meio da API Fetch.
- Autenticação com JWT.
- Controle de acesso por perfil.
- Operações de cadastro, consulta, atualização e exclusão (CRUD) para as principais entidades.

Nesta primeira entrega, foram preparados a estrutura inicial e a documentação. As tecnologias acima representam a arquitetura planejada para o sistema completo.

## Arquitetura inicial do projeto
A arquitetura do projeto será dividida em camadas:
- Interface: páginas para apresentação e futura interação com o usuário.
- Servidor: processamento das regras, rotas da API e integração com os demais componentes.
- Banco de dados: armazenamento das informações de amostras, fornecedores, clientes e movimentações.
- Arquivos SQL: organização dos comandos para criação e manutenção do banco de dados.

Essa organização servirá de base para as próximas entregas, quando as funcionalidades do sistema serão desenvolvidas.

## Estrutura de pastas
```text
Fluxa/
├── backend/
│   ├── controllers/
│   │   └── amostrasController.js
│   ├── middleware/
│   │   └── corsMiddleware.js
│   ├── database/
│   │   └── conexao.js
│   ├── routes/
│   │   └── amostrasRoutes.js
│   ├── .env.example
│   ├── .gitignore
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── sql/
│   └── schema.sql
├── README.md
└── .gitignore
```

O arquivo `.env` é local e está excluído do Git para evitar o envio de configurações privadas. O arquivo `.env.example` pode ser versionado como referência.

## Instalação do servidor
O servidor utiliza Express como dependência inicial. Para instalar as dependências e iniciar o servidor:

```bash
cd backend
npm install
npm start
```

O endereço inicial para verificar o funcionamento do servidor é `http://localhost:3000/api/health`. As demais dependências serão adicionadas conforme as funcionalidades das próximas etapas forem desenvolvidas.

## Escopo da primeira entrega
Nesta entrega, o foco está na definição do problema, na proposta de solução, na documentação do sistema e na estrutura inicial do projeto. Foram contemplados:
- Diagnóstico do problema e apresentação do contexto do sistema;
- Definição dos objetivos e da proposta de solução;
- Documentação dos módulos e perfis planejados;
- Organização inicial das pastas e dos arquivos do projeto;
- Preparação da interface inicial e da estrutura do servidor.

## Funcionalidades efetivamente implementadas nesta entrega
- Estrutura inicial do repositório;
- Documentação do projeto neste arquivo;
- Configuração do servidor com Express;
- Página inicial da interface com apresentação do sistema;
- Arquivo principal do servidor em preparação;
- Organização das pastas conforme a arquitetura proposta.

Não foram implementados banco de dados, autenticação, JWT, controle de permissões, operações CRUD completas nem relatórios, pois essas funcionalidades pertencem às próximas etapas do projeto.

## Funcionalidades previstas para as próximas etapas
- Implementação do banco de dados MySQL;
- Criação do modelo de dados para amostras, fornecedores, clientes e usuários;
- Desenvolvimento da API REST com rotas para operações CRUD;
- Implementação de autenticação com JWT e controle de acesso;
- Desenvolvimento dos módulos de recebimento, inventário e envios;
- Geração de relatórios e exportação de dados;
- Criação de painéis e indicadores;
- Aprimoramento da interface com páginas e componentes dinâmicos.

Nesta primeira entrega, a Fluxa funciona como base documental e estrutural para as próximas fases do projeto, com foco em organização, clareza e preparação para a implementação completa do sistema.
