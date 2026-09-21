// ============================================================
// WEB APP — serve o frontend e expõe funções ao cliente
// ============================================================
// Deploy: Implantar → Nova implantação → App da Web
//   Executar como: Eu
//   Quem tem acesso: Qualquer pessoa conectada com conta Google
// ============================================================

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('agenda-index')
    .setTitle('Agendamento Fast Mídia')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Chamado pelo frontend via google.script.run
// Retorna a configuração pública (sem tokens) para o JS do cliente
function getConfigPublica() {
  const fasts = {};
  Object.keys(CONFIG.FASTS).forEach(function(nome) {
    fasts[nome] = { cor: CONFIG.FASTS[nome].cor };
  });
  return {
    fasts: fasts,
    slots: CONFIG.SLOTS,
  };
}

// Chamado pelo frontend
function getDisponibilidade(dataInicioStr) {
  return getDisponibilidadeSemana(dataInicioStr);
}

// Chamado pelo frontend — identifica a pasta do cliente no Drive (não cria nada)
// Retorna: { status: 'encontrado'|'grupo'|'nao_encontrado'|'erro', ... }
function verificarClienteDrive(nomeCliente) {
  return buscarPastaCliente(nomeCliente);
}

// Chamado pelo frontend — cria o agendamento completo
// dados: { fast, cliente, dataIso, slotLabel, slotInicio, slotFim, observacoes,
//          pastaClienteId? (definido pelo frontend após verificação) }
function criarAgendamento(dados) {
  try {
    const nomeJob = dados.dataIso + ' — ' + dados.cliente;
    let bancoImagensUrl = null;

    if (dados.pastaClienteId) {
      const driveInfo = resolverPastaPorId(dados.pastaClienteId, dados.cliente, dados.dataIso, nomeJob);
      if (driveInfo.status === 'encontrado') {
        bancoImagensUrl = driveInfo.bancoImagensUrl;
      }
    }

    if (!bancoImagensUrl) {
      notificarClienteNaoEncontrado(dados.cliente, nomeJob, dados.fast, dados.dataIso);
    }

    const pageId = processarNovoAgendamento_({
      cliente:          dados.cliente,
      fast:             dados.fast,
      data:             dados.dataIso,
      horario:          dados.dataIso + 'T' + String(dados.slotInicio).padStart(2, '0') + ':00:00',
      bancoImagensUrl:  bancoImagensUrl,
      observacoes:      dados.observacoes || '',
      whatsappAnalista: dados.whatsappAnalista || '',
      prazoMaterial:    dados.prazoMaterial   || '',
      dataEdicao:       dados.dataEdicao      || '',
      blocoEdicao:      dados.blocoEdicao     || '',
    });

    const fastEmail = CONFIG.FASTS[dados.fast] && CONFIG.FASTS[dados.fast].email;
    if (fastEmail) {
      adicionarEventoCalendario_(fastEmail, '[Fast Mídia] ' + dados.cliente,
        dados.dataIso, dados.slotInicio, dados.slotFim, pageId);
    }

    // Bloqueia edição no calendário da supervisora
    if (dados.dataEdicao && dados.blocoEdicao) {
      const edicaoInicio = dados.blocoEdicao === 'manha' ? 8 : 13;
      const edicaoFim    = dados.blocoEdicao === 'manha' ? 12 : 17;
      adicionarEventoCalendario_(CONFIG.EMAIL_SUPERVISORA,
        '[Fast Mídia] Edição — ' + dados.cliente,
        dados.dataEdicao, edicaoInicio, edicaoFim, pageId);
    }

    return { ok: true, pageId: pageId, semPasta: !bancoImagensUrl };
  } catch (e) {
    Logger.log('Erro em criarAgendamento: ' + e.message);
    return { ok: false, erro: e.message };
  }
}

// Bloqueia o slot no calendário do Fast
function adicionarEventoCalendario_(calEmail, titulo, dataStr, horaInicio, horaFim, notionPageId) {
  try {
    const cal = CalendarApp.getCalendarById(calEmail);
    if (!cal) return;

    const partes = dataStr.split('-');
    const inicio = new Date(partes[0], partes[1] - 1, partes[2], horaInicio, 0, 0);
    const fim    = new Date(partes[0], partes[1] - 1, partes[2], horaFim,   0, 0);

    cal.createEvent(titulo, inicio, fim, {
      description: 'Job criado via Agendamento Fast Mídia.\nNotion: https://www.notion.so/' + (notionPageId || '').replace(/-/g, ''),
    });
  } catch (e) {
    Logger.log('Erro ao criar evento no calendário: ' + e.message);
  }
}

// Limpa cache de disponibilidade de todas as semanas (roda do editor quando necessário)
function limparCacheDisponibilidade() {
  const cache = CacheService.getScriptCache();
  const hoje = new Date();
  // Limpa as próximas 8 semanas
  for (let i = -1; i <= 8; i++) {
    const d = new Date(hoje.getTime() + i * 7 * 86400000);
    const seg = new Date(d);
    const dia = seg.getDay();
    seg.setDate(seg.getDate() + (dia === 0 ? 1 : 1 - dia));
    const key = 'disp_' + seg.getFullYear() + '-' +
      String(seg.getMonth()+1).padStart(2,'0') + '-' +
      String(seg.getDate()).padStart(2,'0');
    cache.remove(key);
  }
  Logger.log('Cache de disponibilidade limpo.');
}

// Retorna usuário logado (para exibir no header do app)
function getUsuarioAtual() {
  try {
    const user = Session.getActiveUser();
    return user.getEmail();
  } catch (e) {
    return '';
  }
}
