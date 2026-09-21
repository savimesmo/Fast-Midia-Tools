// ============================================================
// TRIGGER DE NOVO AGENDAMENTO
// Suporta dois modos:
//   A) Web App (doPost) — recebe webhook do Calendly / cal.com
//   B) Google Calendar trigger — chamada via onCalendarEvent()
// ============================================================

// ---- Modo A: Web App (Calendly / cal.com webhook) -----------

function doPost(e) {
  try {
    const raw = JSON.parse(e.postData.contents);
    const dados = parsearWebhook_(raw);

    if (!dados) {
      return resposta_('evento ignorado (tipo não reconhecido)', 200);
    }

    processarNovoAgendamento_(dados);
    return resposta_('ok', 200);

  } catch (err) {
    Logger.log('Erro em doPost: ' + err.message);
    return resposta_(err.message, 500);
  }
}

// Normaliza payload de Calendly ou cal.com para um objeto padrão
function parsearWebhook_(raw) {
  // Calendly v2
  if (raw.event === 'invitee.created' && raw.payload) {
    const p = raw.payload;
    return {
      cliente:  p.name || p.email,
      fast:     detectarFast_(p.questions_and_answers),
      data:     p.scheduled_event && p.scheduled_event.start_time
                ? p.scheduled_event.start_time.substring(0, 10)
                : new Date().toISOString().substring(0, 10),
      horario:  p.scheduled_event ? p.scheduled_event.start_time : '',
    };
  }

  // cal.com booking.created
  if (raw.triggerEvent === 'BOOKING_CREATED' && raw.payload) {
    const p = raw.payload;
    return {
      cliente: p.attendees && p.attendees[0] ? p.attendees[0].name : p.responses && p.responses.name ? p.responses.name.value : 'Cliente',
      fast:    detectarFast_(p.responses),
      data:    p.startTime ? p.startTime.substring(0, 10) : new Date().toISOString().substring(0, 10),
      horario: p.startTime || '',
    };
  }

  return null;
}

// Tenta identificar o Fast pelo campo preenchido no agendamento
function detectarFast_(questionsOrResponses) {
  if (!questionsOrResponses) return Object.keys(CONFIG.FASTS)[0];

  const texto = JSON.stringify(questionsOrResponses).toLowerCase();
  for (const nome of Object.keys(CONFIG.FASTS || {})) {
    if (texto.includes(nome.toLowerCase().split(' ')[0])) return nome;
  }
  // Se não achou, retorna o primeiro (supervisora corrige no Notion)
  return Object.keys(CONFIG.FASTS)[0];
}

// ---- Modo B: Google Calendar trigger ---------------------------

// Para usar: vá em Triggers no Apps Script → + Adicionar trigger
// Função: onCalendarEvent | Evento: Do calendário → Evento atualizado
// (requer permissão de leitura do calendário Fest)
function onCalendarEvent() {
  // Lê os próximos 30 min de eventos novos no calendário
  const agora = new Date();
  const limite = new Date(agora.getTime() + 30 * 60 * 1000);
  const eventos = CalendarApp.getDefaultCalendar().getEvents(agora, limite);

  eventos.forEach(function(ev) {
    const titulo = ev.getTitle();
    // Só processa eventos que parecem ser jobs (ajuste o filtro conforme o padrão real)
    if (!titulo || titulo.startsWith('[PROCESSADO]')) return;

    processarNovoAgendamento_({
      cliente: titulo,
      fast:    Object.keys(CONFIG.FASTS)[0], // supervisora preenche no Notion
      data:    Utilities.formatDate(ev.getStartTime(), 'America/Sao_Paulo', 'yyyy-MM-dd'),
      horario: ev.getStartTime().toISOString(),
    });

    // Marca como processado no título para evitar reprocessamento
    ev.setTitle('[PROCESSADO] ' + titulo);
  });
}

// ---- Processamento principal -----------------------------------

function processarNovoAgendamento_(dados) {
  const { cliente, fast, data, horario, bancoImagensUrl,
          observacoes, whatsappAnalista, prazoMaterial, dataEdicao, blocoEdicao } = dados;

  Logger.log('Novo agendamento: ' + JSON.stringify(dados));

  const pastaUrl    = bancoImagensUrl || null;
  const fastsNotion = ['Beatriz Gadelha', 'Gabi Azevedo', 'Rhony'];
  const fastNotion  = fastsNotion.indexOf(fast) !== -1 ? fast : 'Outro';

  // 1. Propriedades Notion
  const props = {
    'Job':                  notionTitle(data + ' — ' + cliente),
    'Cliente':              notionRichText(cliente),
    'Fast Responsável':     notionSelect(fastNotion),
    'Data do Compromisso':  notionDate(data),
    'Status':               notionSelect(CONFIG.STATUS.AGUARDANDO_BRIEFING),
  };
  if (pastaUrl)      props['Pasta de Ingest (Drive)']      = notionUrl(pastaUrl);
  if (prazoMaterial) props['Prazo de Entrega do Material'] = notionDate(prazoMaterial);

  // Monta Observações: texto livre + info de edição
  const obsPartes = [];
  if (observacoes) obsPartes.push(observacoes);
  if (dataEdicao && blocoEdicao) {
    var pEd = dataEdicao.split('-');
    var blocoLabel = blocoEdicao === 'manha' ? 'Manhã (08:00–12:00)' : 'Tarde (13:00–17:00)';
    obsPartes.push('Edição: ' + pEd[2] + '/' + pEd[1] + '/' + pEd[0] + ' — ' + blocoLabel);
  }
  if (obsPartes.length > 0) props['Observações'] = notionRichText(obsPartes.join('\n'));

  const pagina = notionCreatePage(props);
  const pageId = pagina.id;
  Logger.log('Página Notion criada: ' + pageId);

  // 2. URL do Forms pré-preenchida com ID do job
  const formsUrl = 'https://docs.google.com/forms/d/' + CONFIG.FORMS_ID
    + '/viewform?' + CONFIG.FORMS_ENTRY_JOB_ID + '=' + encodeURIComponent(pageId);
  notionUpdatePage(pageId, { 'Link do Briefing (Forms)': notionUrl(formsUrl) });

  // 3. Formata horários para mensagens
  const horarioFormatado = horario
    ? Utilities.formatDate(new Date(horario), 'America/Sao_Paulo', 'dd/MM HH:mm')
    : data;
  const prazoFormatado = prazoMaterial
    ? (function() { var p = prazoMaterial.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; })()
    : '—';
  const edicaoFormatada = (function() {
    if (!dataEdicao || !blocoEdicao) return null;
    var p = dataEdicao.split('-');
    return p[2]+'/'+p[1]+'/'+p[0] + ' (' + (blocoEdicao === 'manha' ? 'manhã' : 'tarde') + ')';
  })();

  // 4. WhatsApp para o Analista (responsável pelo briefing)
  // Normaliza número: remove não-dígitos e adiciona 55 se não tiver DDI
  if (whatsappAnalista) {
    whatsappAnalista = whatsappAnalista.replace(/\D/g, '');
    if (whatsappAnalista.length <= 11) whatsappAnalista = '55' + whatsappAnalista;
    var msgAnalista = [
      '📋 *Fast Mídia — Novo Job Agendado*',
      '',
      '📅 Data: ' + horarioFormatado,
      '🎯 Cliente: ' + cliente,
      '📸 Fast: ' + fast,
      '',
      '👉 *Preenche o briefing agora:*',
      formsUrl,
      '',
      pastaUrl ? '📁 Pasta de ingest:\n' + pastaUrl
               : '⚠️ Pasta de ingest ainda não criada — aguarda aviso da supervisora.',
    ].join('\n');
    try {
      waSendText(whatsappAnalista, msgAnalista);
    } catch (e) {
      Logger.log('WhatsApp analista falhou: ' + e.message);
      emailFallback(CONFIG.EMAIL_SUPERVISORA,
        '[Fast Mídia] WhatsApp do analista falhou',
        'Job criado mas mensagem ao analista não foi enviada.\n\n' + msgAnalista);
    }
  }

  // 5. WhatsApp para o Fast (job + pasta de ingest)
  const numeroFast = CONFIG.FASTS[fast] && CONFIG.FASTS[fast].phone;
  var linhasFast = [
    '📸 *Novo job confirmado!*',
    '',
    '📅 Data: ' + horarioFormatado,
    '🎯 Cliente: ' + cliente,
    '',
    pastaUrl ? '📁 *Sobe o material aqui:*\n' + pastaUrl
             : '⚠️ Pasta de ingest ainda não criada — aguarda confirmação.',
    '',
    '⏰ Prazo para entrega do material: ' + prazoFormatado,
  ];
  if (edicaoFormatada) linhasFast.push('✂️ Edição agendada: ' + edicaoFormatada);
  var msgFast = linhasFast.join('\n');

  try {
    waSendText(numeroFast, msgFast);
  } catch (e) {
    emailFallback(CONFIG.EMAIL_SUPERVISORA,
      '[Fast Mídia] WhatsApp falhou — notificar ' + fast + ' manualmente',
      'Job criado mas WhatsApp falhou.\n\nDados:\n' + msgFast);
  }

  Logger.log('Processamento concluído para job ' + pageId);
  return pageId;
}

function resposta_(msg, code) {
  return ContentService.createTextOutput(JSON.stringify({ status: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
