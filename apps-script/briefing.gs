// ============================================================
// TRIGGER DE RESPOSTA DO GOOGLE FORMS — briefing de gravação
// ============================================================
// Como instalar o trigger:
//   1. Abra o Google Forms de briefing
//   2. Vá em ⋮ → Script do editor
//   3. Cole este arquivo lá (ou crie um projeto separado)
//   4. Triggers → + Adicionar → onFormSubmit → Envio de formulário
// ============================================================

// Índices das perguntas no Forms (0-indexed — ajuste conforme a ordem real do form)
const FORM_FIELD = {
  ID_JOB:              0,  // campo oculto pré-preenchido com o ID da página Notion
  NOME_FAST:           1,
  CLIENTE:             2,
  DATA_HORARIO:        3,
  LOCAL:               4,
  ROTEIRO:             5,
  REFERENCIA_VISUAL:   6,
  OBSERVACOES_CLIENTE: 7,
  PRECISA_99:          8,  // "Sim" ou "Não"
};

function onFormSubmit(e) {
  try {
    const respostas = e.values; // array com todas as respostas na ordem das perguntas

    const pageId       = respostas[FORM_FIELD.ID_JOB].trim();
    const nomeFast     = respostas[FORM_FIELD.NOME_FAST];
    const cliente      = respostas[FORM_FIELD.CLIENTE];
    const local        = respostas[FORM_FIELD.LOCAL];
    const roteiro      = respostas[FORM_FIELD.ROTEIRO];
    const obs          = respostas[FORM_FIELD.OBSERVACOES_CLIENTE];
    const precisa99    = respostas[FORM_FIELD.PRECISA_99].toLowerCase() === 'sim';

    if (!pageId) {
      Logger.log('Resposta sem ID de job — ignorando');
      return;
    }

    // Monta texto consolidado para o campo Observações no Notion
    const observacoesTexto = [
      local    ? '📍 Local: ' + local : '',
      roteiro  ? '📝 Roteiro: ' + roteiro : '',
      obs      ? '💬 Obs do cliente: ' + obs : '',
    ].filter(Boolean).join('\n');

    // Atualiza o registro no Notion
    notionUpdatePage(pageId, {
      'Status':               notionSelect(CONFIG.STATUS.BRIEFING_RECEBIDO),
      'Observações':          notionRichText(observacoesTexto),
      'Corrida 99 Solicitada': notionCheckbox(precisa99),
    });

    Logger.log('Briefing registrado para job ' + pageId);

    // Notifica supervisora por e-mail
    const assunto = '[Fast Mídia] Briefing recebido — ' + cliente + ' (' + nomeFast + ')';
    const corpo = [
      'Briefing preenchido pelo Fast ' + nomeFast + '.',
      '',
      'Cliente: ' + cliente,
      'Local: ' + local,
      'Precisa de 99: ' + (precisa99 ? 'SIM' : 'Não'),
      '',
      'Roteiro/instruções:',
      roteiro,
      '',
      'Obs do cliente:',
      obs,
      '',
      'Ver no Notion: https://www.notion.so/' + pageId.replace(/-/g, ''),
    ].join('\n');

    emailFallback(CONFIG.EMAIL_SUPERVISORA, assunto, corpo);

  } catch (err) {
    Logger.log('Erro no onFormSubmit: ' + err.message);
    emailFallback(
      CONFIG.EMAIL_SUPERVISORA,
      '[Fast Mídia] ERRO ao processar briefing',
      'Erro: ' + err.message + '\n\nRespostas: ' + JSON.stringify(e.values)
    );
  }
}
