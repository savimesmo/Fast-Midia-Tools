// ============================================================
// WHATSAPP CLOUD API — envio de mensagens
// ============================================================

// Envia mensagem de texto livre (funciona dentro da janela de 24h)
function waSendText(toNumber, text) {
  const payload = {
    messaging_product: 'whatsapp',
    to: toNumber,
    type: 'text',
    text: { body: text },
  };
  return waRequest_(payload);
}

// Envia template aprovado (funciona fora da janela de 24h)
// templateName deve ser um template já aprovado no Meta Business Manager
function waSendTemplate(toNumber, templateName, components) {
  const payload = {
    messaging_product: 'whatsapp',
    to: toNumber,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'pt_BR' },
      components: components || [],
    },
  };
  return waRequest_(payload);
}

function waRequest_(payload) {
  const url = 'https://graph.facebook.com/v19.0/' + CONFIG.WHATSAPP_PHONE_NUMBER_ID + '/messages';
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + CONFIG.WHATSAPP_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const res = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(res.getContentText());

  if (res.getResponseCode() >= 400) {
    const msg = (data.error && data.error.message) || JSON.stringify(data);
    Logger.log('WhatsApp API erro ' + res.getResponseCode() + ': ' + msg);
    throw new Error('WhatsApp API ' + res.getResponseCode() + ': ' + msg);
  }
  return data;
}

// Roda direto do editor para testar a conexão WhatsApp
function testarWhatsApp() {
  try {
    const r = waSendText(CONFIG.FASTS['DUMMY'].phone, '✅ Teste Fast Mídia — ' + new Date().toLocaleString());
    Logger.log('OK: ' + JSON.stringify(r));
  } catch (e) {
    Logger.log('FALHOU: ' + e.message);
  }
}

// Keep-alive diário: garante que a janela de 24h está aberta
// Configure um trigger de tempo (09:00) para chamar esta função
function waKeepAlive() {
  const hoje = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM');
  const msg = '☀️ Bom dia! Confirma que você está em expediente hoje (' + hoje + ')? Responda "OK" para receber os jobs do dia.';

  Object.values(CONFIG.FASTS).forEach(function(fast) {
    try {
      waSendText(fast.phone, msg);
    } catch (e) {
      Logger.log('Keep-alive falhou para ' + numero + ': ' + e.message);
    }
  });
}

// Fallback por e-mail quando WhatsApp falha
function emailFallback(destinatario, assunto, corpo) {
  GmailApp.sendEmail(destinatario, assunto, corpo);
}
