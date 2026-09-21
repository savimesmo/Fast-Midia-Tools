// ============================================================
// GOOGLE DRIVE — navegação na estrutura CRIAÇÃO/[ANO]/[CLIENTE]
// Usa Drive API avançada (v2) para suporte a Shared Drives.
// ============================================================

// DRIVE_CRIACAO_FOLDER_ID aponta para a pasta do ano corrente (ex: !2026)
// que contém diretamente as pastas de cada cliente.
//
// Estrutura esperada por cliente:
//   CLIENTE/!INSTITUCIONAL/BANCO DE IMAGENS/(MÊS)/(NOME DO JOB)/
//   CLIENTE/!INSTITUCIONAL/VÍDEOS/(MÊS)/(NOME DO JOB)/
//
// Pasta GRUPO: quando a pasta do cliente não contém !INSTITUCIONAL diretamente
// — significa que há sub-clientes dentro dela.

function buscarPastaCliente(nomeCliente) {
  try {
    const todas = listarSubpastas_(CONFIG.DRIVE_CRIACAO_FOLDER_ID);
    const nomeNorm = normalizar_(nomeCliente);

    const exata = todas.filter(function(p) { return normalizar_(p.title) === nomeNorm; })[0];
    if (exata) return analisarPastaCliente_(exata, nomeCliente);

    const similares = todas.filter(function(p) {
      const nomeP = normalizar_(p.title);
      return nomeP.indexOf(nomeNorm) !== -1 || nomeNorm.indexOf(nomeP) !== -1 || levenshtein_(nomeNorm, nomeP) <= 3;
    }).map(function(p) {
      return { nome: p.title, id: p.id };
    });

    return { status: 'nao_encontrado', similares: similares };
  } catch (e) {
    Logger.log('Erro ao buscar pasta cliente: ' + e.message);
    return { status: 'erro', mensagem: e.message };
  }
}

// Detecta se a pasta é simples (tem !INSTITUCIONAL direto) ou grupo (sub-clientes dentro)
function analisarPastaCliente_(pasta, nomeCliente) {
  const subpastas = listarSubpastas_(pasta.id);
  const temInstitucional = subpastas.some(function(p) {
    return normalizar_(p.title) === '!institucional';
  });

  if (temInstitucional || subpastas.length === 0) {
    return {
      status:      'encontrado',
      tipo:        'simples',
      nomeCliente: nomeCliente,
      pastaId:     pasta.id,
    };
  }

  // Sem !INSTITUCIONAL direto → pasta de grupo com sub-clientes
  return {
    status:       'grupo',
    nomeGrupo:    pasta.title,
    pastaGrupoId: pasta.id,
    subclientes:  subpastas.map(function(sp) {
      return { nome: sp.title, id: sp.id };
    }),
  };
}

// Cria a estrutura completa de pastas para o job e retorna as URLs
function resolverPastaPorId(pastaId, nomeCliente, data, nomeJob) {
  try {
    return resolverPastaCliente_(pastaId, nomeCliente, data, nomeJob);
  } catch (e) {
    Logger.log('Erro em resolverPastaPorId: ' + e.message);
    return { status: 'erro', mensagem: e.message };
  }
}

function resolverPastaCliente_(pastaClienteId, nomeCliente, data, nomeJob) {
  const mes = nomeMesPT_(data);
  const institucionalId = obterOuCriarSubpasta_(pastaClienteId, '!INSTITUCIONAL');

  const bancoId    = obterOuCriarSubpasta_(institucionalId, 'BANCO DE IMAGENS');
  const bancoMesId = obterOuCriarSubpasta_(bancoId, mes);
  const bancoJobId = obterOuCriarSubpasta_(bancoMesId, nomeJob);

  const videosId    = obterOuCriarSubpasta_(institucionalId, 'VÍDEOS');
  const videosMesId = obterOuCriarSubpasta_(videosId, mes);
  const videosJobId = obterOuCriarSubpasta_(videosMesId, nomeJob);

  try {
    DriveApp.getFolderById(bancoJobId).setSharing(
      DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT
    );
  } catch(e) {}

  return {
    status:          'encontrado',
    nomeCliente:     nomeCliente,
    bancoImagensUrl: 'https://drive.google.com/drive/folders/' + bancoJobId,
    videosUrl:       'https://drive.google.com/drive/folders/' + videosJobId,
  };
}

function nomeMesPT_(dataStr) {
  const meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
                 'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
  const partes = dataStr.split('-');
  return meses[parseInt(partes[1], 10) - 1];
}

function notificarClienteNaoEncontrado(nomeCliente, nomeJob, nomeFast, data) {
  const assunto = '[Fast Mídia] ⚠️ Pasta de cliente não encontrada — ' + nomeCliente;
  const corpo = [
    'Um novo job foi criado mas a pasta do cliente não existe no Drive.',
    '',
    'Job:     ' + nomeJob,
    'Cliente: ' + nomeCliente,
    'Fast:    ' + nomeFast,
    'Data:    ' + data,
    '',
    'Por favor:',
    '  1. Crie a pasta do cliente em CRIAÇÃO/!'+new Date().getFullYear()+'/'+nomeCliente,
    '     OU informe qual pasta existente corresponde a este cliente.',
    '  2. Abra o registro no Notion e preencha o campo "Pasta de Ingest" com o link correto.',
    '',
    'Drive CRIAÇÃO: https://drive.google.com/open?id=' + CONFIG.DRIVE_CRIACAO_FOLDER_ID,
  ].join('\n');
  emailFallback(CONFIG.EMAIL_SUPERVISORA, assunto, corpo);
}

// ── Helpers Drive API (Shared Drive safe) ────────────────────

function listarSubpastas_(parentId) {
  const items = [];
  let pageToken = null;
  do {
    const params = {
      q: "'" + parentId + "' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'nextPageToken,items(id,title)',
      corpora: 'allDrives',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      maxResults: 200,
    };
    if (pageToken) params.pageToken = pageToken;
    const res = Drive.Files.list(params);
    (res.items || []).forEach(function(i) { items.push(i); });
    pageToken = res.nextPageToken;
  } while (pageToken);
  return items;
}

// Lista recursivamente o conteúdo de uma pasta (até 2 níveis) — roda do editor
function listarEstruturaPasta(pastaId) {
  pastaId = pastaId || '1RlfmkrzO4tTJHT-RrqjQSXTe_BaXZ2M1'; // PUMP
  Logger.log('=== ESTRUTURA DA PASTA ' + pastaId + ' ===');
  const nivel1 = listarSubpastas_(pastaId);
  if (nivel1.length === 0) {
    Logger.log('(pasta vazia)');
    return;
  }
  nivel1.forEach(function(p1) {
    Logger.log('📁 ' + p1.title + ' [' + p1.id + ']');
    const nivel2 = listarSubpastas_(p1.id);
    nivel2.forEach(function(p2) {
      Logger.log('  📁 ' + p2.title + ' [' + p2.id + ']');
    });
  });
}

// Roda do editor para diagnosticar acesso ao Drive
function testeDriveAcesso() {
  const id = CONFIG.DRIVE_CRIACAO_FOLDER_ID;
  Logger.log('=== DIAGNÓSTICO DRIVE ===');
  try {
    const pasta = DriveApp.getFolderById(id);
    Logger.log('DriveApp nome: ' + pasta.getName());
  } catch(e) { Logger.log('DriveApp ERRO: ' + e.message); }
  try {
    const res = Drive.Files.list({
      q: "'" + id + "' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'items(id,title)',
      corpora: 'allDrives',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      maxResults: 10,
    });
    Logger.log('Drive API pastas: ' + JSON.stringify(res.items));
  } catch(e) { Logger.log('Drive API ERRO: ' + e.message); }
}

function obterOuCriarSubpasta_(parentId, nome) {
  const existente = listarSubpastas_(parentId)
    .filter(function(p) { return p.title === nome; })[0];
  if (existente) return existente.id;

  const nova = Drive.Files.insert({
    title: nome,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [{ id: parentId }],
  }, null, { supportsAllDrives: true });
  return nova.id;
}

function normalizar_(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function levenshtein_(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, function(_, i) {
    return Array.from({length: n+1}, function(_, j) { return i === 0 ? j : j === 0 ? i : 0; });
  });
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}
