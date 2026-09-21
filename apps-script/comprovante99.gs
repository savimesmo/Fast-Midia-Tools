// ============================================================
// VALIDADOR DE COMPROVANTE 99 — roda periodicamente
// ============================================================
// Regra: se "Corrida 99 Solicitada" = sim e Status = "Concluído",
//        ao menos um dos comprovantes (Ida ou Volta) deve estar anexado.
//        Se faltar, reverte o status e notifica a supervisora.
// ============================================================
// Como instalar o trigger:
//   Triggers → + Adicionar → validarComprovantes99
//   Tipo: Por tempo → Diário → Entre 08:00 e 09:00
// ============================================================

function validarComprovantes99() {
  // Busca todos os jobs Concluídos com Corrida 99 Solicitada = true
  const resultado = notionQueryDatabase({
    and: [
      {
        property: 'Status',
        select: { equals: CONFIG.STATUS.CONCLUIDO },
      },
      {
        property: 'Corrida 99 Solicitada',
        checkbox: { equals: true },
      },
    ],
  });

  const inconsistentes = [];

  resultado.results.forEach(function(page) {
    const compIda    = notionReadText(page, 'Comprovante 99 - Ida');    // true se tem arquivo
    const compVolta  = notionReadText(page, 'Comprovante 99 - Volta');   // true se tem arquivo
    const job        = notionReadText(page, 'Job');
    const fast       = notionReadText(page, 'Fast Responsável');
    const pageId     = page.id;

    if (!compIda || !compVolta) {
      inconsistentes.push({ pageId, job, fast, compIda, compVolta });

      // Reverte status para "Material entregue" para bloquear a conclusão
      notionUpdatePage(pageId, {
        'Status':      notionSelect(CONFIG.STATUS.MATERIAL_ENTREGUE),
        'Observações': notionRichText(
          '[⚠️ Auto-revertido ' + new Date().toLocaleDateString('pt-BR') + '] '
          + 'Status voltou para "Material entregue" porque falta(m) comprovante(s) da corrida 99. '
          + 'Anexe os comprovantes antes de marcar como Concluído.'
        ),
      });
    }
  });

  if (inconsistentes.length > 0) {
    const linhas = inconsistentes.map(function(i) {
      return '• ' + i.job + ' (' + i.fast + ')'
        + ' — Ida: ' + (i.compIda ? '✅' : '❌')
        + ' / Volta: ' + (i.compVolta ? '✅' : '❌');
    });

    emailFallback(
      CONFIG.EMAIL_SUPERVISORA,
      '[Fast Mídia] ⚠️ ' + inconsistentes.length + ' job(s) com comprovante 99 faltando',
      [
        'Os seguintes jobs foram revertidos para "Material entregue" por falta de comprovante da corrida 99:',
        '',
        linhas.join('\n'),
        '',
        'Acesse o Notion, anexe os comprovantes e mude o status para Concluído novamente.',
        'https://app.notion.com/p/' + CONFIG.NOTION_DATABASE_ID,
      ].join('\n')
    );

    Logger.log('Revertidos ' + inconsistentes.length + ' jobs com comprovante faltando.');
  } else {
    Logger.log('Validação de comprovantes 99 OK — nenhum inconsistente.');
  }
}

// Versão manual — pode ser chamada pela supervisora a qualquer momento
function verificarAgora() {
  validarComprovantes99();
}
