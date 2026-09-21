// ============================================================
// DISPONIBILIDADE — leitura dos Google Calendários dos Fasts
// ============================================================
// Pré-requisito: cada Fast precisa compartilhar o calendário
// com a conta que vai rodar o script:
//   Google Calendar → Configurações → [calendário] → Compartilhar
//   → Adicionar e-mail da conta do script → "Ver todos os detalhes"
// ============================================================

// Retorna disponibilidade de UM Fast para a semana inteira.
// Faz UMA chamada ao Calendar API por Fast (em vez de N_slots × N_dias).
// dataInicioStr: 'AAAA-MM-DD' (segunda-feira)
// Retorno: { 'AAAA-MM-DD': { slotLabel: { status, eventos? } } }
//          | { status: 'sem_acesso' }   (se calendário inacessível)
function getDisponibilidadeFast(fastNome, dataInicioStr) {
  const fast = CONFIG.FASTS[fastNome];
  if (!fast) return { status: 'sem_acesso' };

  const tz    = CONFIG.TIMEZONE;
  const inicio = parseDateBR_(dataInicioStr, 0);
  const fimSem = parseDateBR_(dataInicioStr, 5);

  let eventosSemanais;
  try {
    const cal = CalendarApp.getCalendarById(fast.email);
    if (!cal) return { status: 'sem_acesso' };
    eventosSemanais = cal.getEvents(inicio, fimSem);
  } catch (e) {
    Logger.log('sem_acesso para ' + fastNome + ': ' + e.message);
    return { status: 'sem_acesso' };
  }

  const resultado = {};
  for (var d = 0; d < 5; d++) {
    const diaDt  = new Date(inicio.getTime() + d * 86400000);
    const diaStr = Utilities.formatDate(diaDt, tz, 'yyyy-MM-dd');
    resultado[diaStr] = {};

    CONFIG.SLOTS.forEach(function(slot) {
      const sIni = new Date(diaDt.getFullYear(), diaDt.getMonth(), diaDt.getDate(), slot.inicio, 0, 0);
      const sFim = new Date(diaDt.getFullYear(), diaDt.getMonth(), diaDt.getDate(), slot.fim,   0, 0);

      const conflitos = eventosSemanais.filter(function(ev) {
        return ev.getStartTime() < sFim && ev.getEndTime() > sIni;
      });

      if (conflitos.length === 0) {
        resultado[diaStr][slot.inicio] = { status: 'livre' };
      } else {
        resultado[diaStr][slot.inicio] = {
          status: 'ocupado',
          eventos: conflitos.map(function(ev) {
            return {
              titulo: ev.getTitle() || '(sem título)',
              inicio: Utilities.formatDate(ev.getStartTime(), tz, 'HH:mm'),
              fim:    Utilities.formatDate(ev.getEndTime(),   tz, 'HH:mm'),
            };
          }),
        };
      }
    });
  }

  return resultado;
}

// Retorna disponibilidade de TODOS os Fasts e dias da semana num único objeto.
// Estrutura: { diaIso: { slotIdx: { fastNome: { status, eventos? } } } }
// slotIdx = 0 (manhã) ou 1 (tarde) — índice numérico, sem string especial.
function getDisponibilidadeSemana(dataInicioStr) {
  const tz = CONFIG.TIMEZONE;
  const inicio = parseDateBR_(dataInicioStr, 0);
  const resultado = {};

  for (var d = 0; d < 5; d++) {
    const diaDt = new Date(inicio.getTime() + d * 86400000);
    const diaStr = Utilities.formatDate(diaDt, tz, 'yyyy-MM-dd');
    resultado[diaStr] = {};

    CONFIG.SLOTS.forEach(function(slot, idx) {
      const sIni = new Date(diaDt.getFullYear(), diaDt.getMonth(), diaDt.getDate(), slot.inicio, 0, 0);
      const sFim = new Date(diaDt.getFullYear(), diaDt.getMonth(), diaDt.getDate(), slot.fim,   0, 0);
      var celula = {};
      Object.keys(CONFIG.FASTS).forEach(function(fastNome) {
        celula[fastNome] = checarDisponibilidadeFast_(CONFIG.FASTS[fastNome].email, sIni, sFim);
      });
      // Três chaves para garantir que a lookup no frontend funcione
      // independentemente de como o GAS serializa o objeto
      resultado[diaStr][idx]            = celula;
      resultado[diaStr][slot.inicio]    = celula;
      resultado[diaStr]['s' + idx]      = celula;
    });
  }

  return resultado;
}

function invalidarCacheDisponibilidade(dataInicioStr) {
  CacheService.getScriptCache().remove('disp_' + dataInicioStr);
}

// Checa se um Fast está livre num intervalo de tempo
// Retorna: { status: 'livre'|'ocupado', eventos: [{ titulo, inicio, fim }] }
function checarDisponibilidadeFast_(calEmail, inicio, fim) {
  try {
    const cal = CalendarApp.getCalendarById(calEmail);
    if (!cal) {
      return { status: 'sem_acesso' };
    }

    const eventos = cal.getEvents(inicio, fim);
    if (eventos.length === 0) {
      return { status: 'livre' };
    }

    const lista = eventos.map(function(ev) {
      return {
        titulo: ev.getTitle() || '(sem título)',
        inicio: Utilities.formatDate(ev.getStartTime(), CONFIG.TIMEZONE, 'HH:mm'),
        fim:    Utilities.formatDate(ev.getEndTime(),   CONFIG.TIMEZONE, 'HH:mm'),
      };
    });

    return { status: 'ocupado', eventos: lista };

  } catch (e) {
    Logger.log('Erro ao ler calendário de ' + calEmail + ': ' + e.message);
    return { status: 'erro', mensagem: e.message };
  }
}

// Retorna os slots disponíveis para uma data específica (para o modal de agendamento)
function getSlotsDisponiveis(dataStr) {
  const semana = getDisponibilidadeSemana(dataStr);
  return semana[dataStr] || {};
}

// Converte 'AAAA-MM-DD' em Date no timezone de Brasília (meia-noite local)
function parseDateBR_(dataStr, diasAMais) {
  const partes = dataStr.split('-');
  const dt = new Date(
    parseInt(partes[0]),
    parseInt(partes[1]) - 1,
    parseInt(partes[2]) + (diasAMais || 0)
  );
  return dt;
}
