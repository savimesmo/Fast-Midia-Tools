// Roda UMA VEZ para criar o Google Forms de briefing completo.
// Depois de rodar, copie o FORMS_ID e o FORMS_ENTRY_JOB_ID que aparecem no log.

function criarFormsBriefing() {
  // Apaga o Forms vazio que você criou manualmente (opcional)
  // e cria um novo do zero com todos os campos certos.

  const form = FormApp.create('Briefing de Gravação — Fast Mídia');
  form.setDescription(
    'Preencha antes de cada gravação. O link da pasta de ingest foi enviado junto com este link — ' +
    'suba o material lá após gravar.'
  );
  form.setCollectEmail(false);
  form.setShowLinkToRespondAgain(false);

  // Campo 1 — ID do Job (campo técnico, pré-preenchido pela automação)
  const campoId = form.addTextItem();
  campoId.setTitle('ID do Job (não altere)');
  campoId.setHelpText('Campo preenchido automaticamente. Não modifique.');
  campoId.setRequired(false);

  // Campo 2 — Nome do Fast
  form.addTextItem()
    .setTitle('Seu nome (Fast)')
    .setRequired(true);

  // Campo 3 — Cliente
  form.addTextItem()
    .setTitle('Nome do cliente')
    .setRequired(true);

  // Campo 4 — Data e horário
  form.addDateTimeItem()
    .setTitle('Data e horário confirmado')
    .setRequired(true);

  // Campo 5 — Local
  form.addParagraphTextItem()
    .setTitle('Local da gravação (endereço completo)')
    .setRequired(true);

  // Campo 6 — Roteiro
  form.addParagraphTextItem()
    .setTitle('Roteiro / instruções do job')
    .setRequired(true);

  // Campo 7 — Referência visual (upload)
  // Nota: upload só funciona quando o Forms está dentro de um Google Workspace pago.
  // Se der erro aqui, comente as 3 linhas abaixo.
  try {
    form.addFileUploadItem()
      .setTitle('Referência visual (opcional)')
      .setRequired(false);
  } catch(e) {
    form.addTextItem()
      .setTitle('Referência visual — cole um link (opcional)')
      .setRequired(false);
  }

  // Campo 8 — Observações do cliente
  form.addParagraphTextItem()
    .setTitle('Observações do cliente')
    .setRequired(false);

  // Campo 9 — Precisa de 99?
  const item99 = form.addMultipleChoiceItem();
  item99.setTitle('Precisa de transporte (99)?');
  item99.setChoices([
    item99.createChoice('Sim'),
    item99.createChoice('Não'),
  ]);
  item99.setRequired(true);

  // ── Pegar o entry ID do campo "ID do Job" (necessário para pré-preenchimento) ──
  const items = form.getItems();
  const entryId = items[0].asTextItem().getId();

  const formId  = form.getId();
  const formUrl = form.getPublishedUrl();

  Logger.log('=== COPIE ESSES VALORES PARA O config.gs ===');
  Logger.log('FORMS_ID: ' + formId);
  Logger.log('FORMS_ENTRY_JOB_ID: entry.' + entryId);
  Logger.log('URL do Forms: ' + formUrl);
  Logger.log('============================================');

  // Exibe também num alerta para facilitar
  SpreadsheetApp && SpreadsheetApp.getUi
    ? null
    : Browser.msgBox(
        'Forms criado!\n\nFORMS_ID: ' + formId +
        '\nFORMS_ENTRY_JOB_ID: entry.' + entryId
      );
}
