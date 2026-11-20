const API_URL = window.FLUXA_API_URL || 'http://localhost:3000/api';
const $ = (selector) => document.querySelector(selector);
const authForm = $('#auth-form');
const sampleForm = $('#sample-form');
let token = localStorage.getItem('fluxa_token');
let usuario = JSON.parse(localStorage.getItem('fluxa_usuario') || 'null');
let editandoId = null;
let modoCadastro = false;

async function api(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 && token) sair(false);
  if (!response.ok) throw new Error(payload.message || 'Ocorreu um erro na requisição.');
  return payload;
}

function mostrarMensagem(seletor, texto, erro = false) {
  const elemento = $(seletor);
  elemento.textContent = texto;
  elemento.classList.toggle('error', erro);
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function salvarSessao(dados) {
  token = dados.token;
  usuario = dados.usuario;
  localStorage.setItem('fluxa_token', token);
  localStorage.setItem('fluxa_usuario', JSON.stringify(usuario));
  mostrarAplicacao();
}

function sair(recarregar = true) {
  token = null;
  usuario = null;
  localStorage.removeItem('fluxa_token');
  localStorage.removeItem('fluxa_usuario');
  $('#user-session').classList.add('hidden');
  $('#app-section').classList.add('hidden');
  $('#auth-section').classList.remove('hidden');
  if (recarregar) mostrarMensagem('#auth-message', 'Sessão encerrada.');
}

function mostrarAplicacao() {
  if (!token || !usuario) return sair(false);
  $('#auth-section').classList.add('hidden');
  $('#app-section').classList.remove('hidden');
  $('#user-session').classList.remove('hidden');
  $('#user-label').textContent = `${usuario.nome} (${usuario.perfil})`;
  $('#supplier-card').classList.toggle('hidden', usuario.perfil !== 'administrador');
  $('#client-card').classList.toggle('hidden', usuario.perfil !== 'administrador');
  $('#samples-body').replaceChildren();
  carregarFornecedores().then(() => Promise.all([
    carregarAmostras(), carregarClientes(), carregarEnvios(), carregarIndicadores(),
  ])).catch((error) => mostrarMensagem('#list-message', error.message, true));
}

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const dados = formData(authForm);
  try {
    const resposta = await api(`/auth/${modoCadastro ? 'register' : 'login'}`, {
      method: 'POST', body: JSON.stringify(dados),
    });
    authForm.reset();
    mostrarMensagem('#auth-message', '');
    salvarSessao(resposta);
  } catch (error) { mostrarMensagem('#auth-message', error.message, true); }
});

$('#auth-toggle').addEventListener('click', () => {
  modoCadastro = !modoCadastro;
  $('#auth-title').textContent = modoCadastro ? 'Criar conta' : 'Entrar';
  $('#auth-submit').textContent = modoCadastro ? 'Criar conta' : 'Entrar';
  $('#name-field').classList.toggle('hidden', !modoCadastro);
  $('#name-field input').required = modoCadastro;
  $('#auth-toggle').textContent = modoCadastro ? 'Já tem uma conta? Entrar' : 'Primeiro acesso? Criar conta';
  mostrarMensagem('#auth-message', modoCadastro ? 'O primeiro usuário cadastrado recebe perfil administrador.' : '');
});

$('#logout-button').addEventListener('click', () => sair());
$('#refresh-button').addEventListener('click', carregarAmostras);
$('#export-csv').addEventListener('click', exportarInventarioCsv);
$('#print-report').addEventListener('click', () => window.print());

async function carregarFornecedores() {
  const { fornecedores } = await api('/fornecedores');
  const selects = [sampleForm.elements.fornecedorId, $('#sample-filters').elements.fornecedorId];
  for (const select of selects) {
    const selecionado = select.value;
    const textoInicial = select === sampleForm.elements.fornecedorId ? 'Selecione' : 'Todos';
    select.replaceChildren(new Option(textoInicial, ''));
    for (const fornecedor of fornecedores) select.add(new Option(`${fornecedor.codigo} — ${fornecedor.nome}`, fornecedor.id));
    if (selecionado) select.value = selecionado;
  }
  const corpo = $('#suppliers-body');
  corpo.replaceChildren();
  for (const fornecedor of fornecedores) {
    const linha = document.createElement('tr');
    for (const valor of [fornecedor.codigo, fornecedor.nome]) {
      const td = document.createElement('td'); td.textContent = valor; linha.append(td);
    }
    const acoes = document.createElement('td');
    acoes.append(acao('Editar', 'secondary', () => editarFornecedor(fornecedor)));
    acoes.append(acao('Excluir', 'danger', () => excluirCadastro('fornecedores', fornecedor.id, 'fornecedor')));
    linha.append(acoes); corpo.append(linha);
  }
}

$('#supplier-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const dados = formData(event.currentTarget);
  const id = dados.id;
  delete dados.id;
  try {
    await api(id ? `/fornecedores/${id}` : '/fornecedores', { method: id ? 'PUT' : 'POST', body: JSON.stringify(dados) });
    event.currentTarget.reset();
    cancelarEdicaoFornecedor();
    mostrarMensagem('#supplier-message', id ? 'Fornecedor atualizado.' : 'Fornecedor cadastrado.');
    await carregarFornecedores();
  } catch (error) { mostrarMensagem('#supplier-message', error.message, true); }
});

function editarFornecedor(fornecedor) {
  const form = $('#supplier-form');
  form.elements.id.value = fornecedor.id; form.elements.codigo.value = fornecedor.codigo; form.elements.nome.value = fornecedor.nome;
  $('#supplier-title').textContent = `Editar fornecedor ${fornecedor.codigo}`;
  $('#supplier-submit').textContent = 'Salvar alterações'; $('#supplier-cancel').classList.remove('hidden');
}

function cancelarEdicaoFornecedor() {
  $('#supplier-form').reset(); $('#supplier-title').textContent = 'Fornecedores';
  $('#supplier-submit').textContent = 'Adicionar fornecedor'; $('#supplier-cancel').classList.add('hidden');
}

$('#supplier-cancel').addEventListener('click', cancelarEdicaoFornecedor);

$('#client-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const dados = formData(event.currentTarget); const id = dados.id; delete dados.id;
  try {
    await api(id ? `/clientes/${id}` : '/clientes', { method: id ? 'PUT' : 'POST', body: JSON.stringify(dados) });
    event.currentTarget.reset(); cancelarEdicaoCliente();
    mostrarMensagem('#client-message', id ? 'Cliente atualizado.' : 'Cliente cadastrado.');
    await carregarClientes();
  } catch (error) { mostrarMensagem('#client-message', error.message, true); }
});

function editarCliente(cliente) {
  const form = $('#client-form');
  form.elements.id.value = cliente.id; form.elements.nome.value = cliente.nome;
  form.elements.pais.value = cliente.pais || ''; form.elements.email.value = cliente.email || '';
  $('#client-title').textContent = `Editar cliente ${cliente.nome}`;
  $('#client-submit').textContent = 'Salvar alterações'; $('#client-cancel').classList.remove('hidden');
}

function cancelarEdicaoCliente() {
  $('#client-form').reset(); $('#client-title').textContent = 'Clientes';
  $('#client-submit').textContent = 'Adicionar cliente'; $('#client-cancel').classList.add('hidden');
}

$('#client-cancel').addEventListener('click', cancelarEdicaoCliente);

async function carregarClientes() {
  const { clientes } = await api('/clientes');
  const selects = [$('#shipment-form').elements.clienteId, $('#shipment-filters').elements.clienteId];
  for (const select of selects) {
    const selecionado = select.value;
    select.replaceChildren(new Option(select === $('#shipment-form').elements.clienteId ? 'Selecione' : 'Todos', ''));
    for (const cliente of clientes) select.add(new Option(cliente.nome, cliente.id));
    if (selecionado) select.value = selecionado;
  }
  const corpo = $('#clients-body'); corpo.replaceChildren();
  for (const cliente of clientes) {
    const linha = document.createElement('tr');
    for (const valor of [cliente.nome, cliente.pais || '—', cliente.email || '—']) {
      const td = document.createElement('td'); td.textContent = valor; linha.append(td);
    }
    const acoes = document.createElement('td');
    acoes.append(acao('Editar', 'secondary', () => editarCliente(cliente)));
    acoes.append(acao('Excluir', 'danger', () => excluirCadastro('clientes', cliente.id, 'cliente')));
    linha.append(acoes); corpo.append(linha);
  }
}

function acao(texto, estilo, callback) {
  const botao = document.createElement('button'); botao.type = 'button'; botao.textContent = texto;
  botao.className = `small ${estilo}`; botao.addEventListener('click', callback); return botao;
}

async function excluirCadastro(recurso, id, nome) {
  if (!window.confirm(`Excluir este ${nome}?`)) return;
  try {
    await api(`/${recurso}/${id}`, { method: 'DELETE' });
    mostrarMensagem(nome === 'cliente' ? '#client-message' : '#supplier-message', `${nome} excluído.`);
    if (nome === 'cliente') await carregarClientes(); else await carregarFornecedores();
  } catch (error) { mostrarMensagem(nome === 'cliente' ? '#client-message' : '#supplier-message', error.message, true); }
}

$('#shipment-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const dados = formData(event.currentTarget); dados.quantidadeEnviada = Number(dados.quantidadeEnviada);
  try {
    await api('/envios', { method: 'POST', body: JSON.stringify(dados) });
    event.currentTarget.reset(); mostrarMensagem('#shipment-message', 'Envio registrado.');
    await Promise.all([carregarAmostras(), carregarEnvios(), carregarIndicadores()]);
  } catch (error) { mostrarMensagem('#shipment-message', error.message, true); }
});

$('#shipment-filters').addEventListener('submit', (event) => { event.preventDefault(); carregarEnvios(); });
$('#refresh-shipments').addEventListener('click', carregarEnvios);
$('#clear-shipment-filters').addEventListener('click', () => { $('#shipment-filters').reset(); carregarEnvios(); });

async function carregarEnvios() {
  const params = new URLSearchParams(Object.entries(formData($('#shipment-filters'))).filter(([, valor]) => valor));
  try {
    const { envios } = await api(`/envios${params.size ? `?${params}` : ''}`);
    const corpo = $('#shipments-body'); corpo.replaceChildren();
    for (const envio of envios) {
      const linha = document.createElement('tr');
      for (const valor of [envio.dataEnvio, envio.codigoAmostra, envio.cliente, envio.paisDestino || '—',
        `${formatarQuantidade(envio.quantidadeEnviada)} kg`, envio.referencia || '—', envio.responsavel || '—']) {
        const td = document.createElement('td'); td.textContent = valor; linha.append(td);
      }
      corpo.append(linha);
    }
    mostrarMensagem('#shipments-message', envios.length ? '' : 'Nenhum envio encontrado.');
  } catch (error) { mostrarMensagem('#shipments-message', error.message, true); }
}

async function carregarIndicadores() {
  try {
    const { indicadores, enviosRecentes } = await api('/indicadores');
    const cards = [
      ['Total de amostras', indicadores.totalAmostras], ['Disponíveis', indicadores.amostrasDisponiveis],
      ['Com envios', indicadores.amostrasComEnvio], ['Esgotadas', indicadores.amostrasEsgotadas],
    ];
    const area = $('#indicators'); area.replaceChildren();
    for (const [titulo, valor] of cards) {
      const item = document.createElement('div'); item.className = 'indicator';
      const label = document.createElement('span'); label.textContent = titulo;
      const number = document.createElement('strong'); number.textContent = valor ?? 0;
      item.append(label, number); area.append(item);
    }
    const lista = $('#recent-shipments'); lista.replaceChildren();
    for (const envio of enviosRecentes) {
      const item = document.createElement('li');
      item.textContent = `${envio.dataEnvio} — ${envio.codigoAmostra} para ${envio.cliente}: ${formatarQuantidade(envio.quantidadeEnviada)} kg`;
      lista.append(item);
    }
    if (!enviosRecentes.length) { const item = document.createElement('li'); item.textContent = 'Ainda não há envios.'; lista.append(item); }
  } catch (error) { mostrarMensagem('#shipment-message', error.message, true); }
}

$('#sample-filters').addEventListener('submit', (event) => { event.preventDefault(); carregarAmostras(); });
$('#clear-filters').addEventListener('click', () => { $('#sample-filters').reset(); carregarAmostras(); });

sampleForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const dados = formData(sampleForm);
  dados.quantidadeRecebida = Number(dados.quantidadeRecebida);
  const estavaEditando = Boolean(editandoId);
  try {
    await api(editandoId ? `/amostras/${editandoId}` : '/amostras', {
      method: editandoId ? 'PUT' : 'POST', body: JSON.stringify(dados),
    });
    resetarFormulario();
    mostrarMensagem('#sample-message', estavaEditando ? 'Amostra atualizada.' : 'Amostra cadastrada.');
    await carregarAmostras();
  } catch (error) { mostrarMensagem('#sample-message', error.message, true); }
});

function formatarQuantidade(valor) {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

function exportarInventarioCsv() {
  const tabela = $('#samples-table');
  const linhas = [...tabela.querySelectorAll('tr')].map((linha) =>
    [...linha.querySelectorAll('th,td')].slice(0, -1).map((celula) => {
      let valor = celula.textContent.trim();
      if (/^[=+@\-\t\r]/.test(valor)) valor = `'${valor}`;
      return `"${valor.replaceAll('"', '""')}"`;
    }).join(';'),
  );
  const arquivo = new Blob([`\uFEFF${linhas.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(arquivo);
  link.download = 'inventario-fluxa.csv'; link.click(); URL.revokeObjectURL(link.href);
}

async function carregarAmostras() {
  try {
    const params = new URLSearchParams(Object.entries(formData($('#sample-filters'))).filter(([, valor]) => valor));
    const { amostras } = await api(`/amostras${params.size ? `?${params}` : ''}`);
    const corpo = $('#samples-body');
    await carregarAmostrasDisponiveisParaEnvio();
    corpo.replaceChildren();
    for (const amostra of amostras) {
      const linha = document.createElement('tr');
      const valores = [amostra.codigo, `${amostra.codigoFornecedor} — ${amostra.fornecedor}`,
        amostra.classificacao || '—', formatarQuantidade(amostra.quantidadeRecebida),
        formatarQuantidade(amostra.quantidadeEnviada), formatarQuantidade(amostra.quantidadeDisponivel),
        amostra.localizacao || '—'];
      for (const valor of valores) {
        const celula = document.createElement('td');
        celula.textContent = valor;
        linha.append(celula);
      }
      const acoes = document.createElement('td');
      const editar = document.createElement('button');
      editar.type = 'button'; editar.className = 'small secondary'; editar.textContent = 'Editar';
      editar.addEventListener('click', () => editarAmostra(amostra));
      acoes.append(editar);
      if (usuario.perfil === 'administrador') {
        const excluir = document.createElement('button');
        excluir.type = 'button'; excluir.className = 'small danger'; excluir.textContent = 'Excluir';
        excluir.addEventListener('click', () => excluirAmostra(amostra));
        acoes.append(excluir);
      }
      linha.append(acoes);
      corpo.append(linha);
    }
    mostrarMensagem('#list-message', amostras.length ? '' : 'Nenhuma amostra cadastrada.');
  } catch (error) { mostrarMensagem('#list-message', error.message, true); }
}

async function carregarAmostrasDisponiveisParaEnvio() {
  const { amostras } = await api('/amostras?status=disponivel');
  const select = $('#shipment-form').elements.amostraId;
  const selecionado = select.value;
  select.replaceChildren(new Option('Selecione', ''));
  for (const amostra of amostras) {
    select.add(new Option(`${amostra.codigo} — ${formatarQuantidade(amostra.quantidadeDisponivel)} kg disponíveis`, amostra.id));
  }
  if (selecionado) select.value = selecionado;
}

function editarAmostra(amostra) {
  editandoId = amostra.id;
  for (const [campo, valor] of Object.entries({
    codigo: amostra.codigo,
    fornecedorId: amostra.fornecedorId,
    classificacao: amostra.classificacao || '',
    dataRecebimento: String(amostra.dataRecebimento).slice(0, 10),
    quantidadeRecebida: amostra.quantidadeRecebida,
    localizacao: amostra.localizacao || '',
    observacoes: amostra.observacoes || '',
  })) sampleForm.elements[campo].value = valor;
  $('#sample-form-title').textContent = `Editar amostra ${amostra.codigo}`;
  $('#sample-submit').textContent = 'Salvar alterações';
  $('#cancel-edit').classList.remove('hidden');
  sampleForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function excluirAmostra(amostra) {
  if (!window.confirm(`Excluir a amostra ${amostra.codigo}?`)) return;
  try {
    await api(`/amostras/${amostra.id}`, { method: 'DELETE' });
    mostrarMensagem('#list-message', 'Amostra excluída.');
    await carregarAmostras();
  } catch (error) { mostrarMensagem('#list-message', error.message, true); }
}

function resetarFormulario() {
  editandoId = null;
  sampleForm.reset();
  $('#sample-form-title').textContent = 'Receber amostra';
  $('#sample-submit').textContent = 'Salvar amostra';
  $('#cancel-edit').classList.add('hidden');
}

$('#cancel-edit').addEventListener('click', resetarFormulario);

if (token && usuario) mostrarAplicacao();
