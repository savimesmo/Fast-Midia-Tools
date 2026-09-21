// ============================================================
// CONFIGURAÇÕES CENTRAIS — copie este arquivo para config.gs
// e preencha todos os valores antes de fazer deploy.
// ============================================================
// ATENÇÃO: config.gs está no .gitignore — nunca suba tokens reais.
// ============================================================

const CONFIG = {
  // Notion — https://www.notion.so/my-integrations
  NOTION_TOKEN: 'ntn_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  NOTION_DATABASE_ID: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',  // ID do banco de jobs

  // Google Drive — ID da pasta raiz CRIAÇÃO (Shared Drive)
  DRIVE_CRIACAO_FOLDER_ID: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',

  // Google Forms de briefing — ID do form e entry ID do campo "ID do Job"
  FORMS_ID: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  FORMS_ENTRY_JOB_ID: 'entry.XXXXXXXXX',

  // WhatsApp Cloud API — https://developers.facebook.com
  WHATSAPP_PHONE_NUMBER_ID: 'XXXXXXXXXXXXXXX',
  WHATSAPP_ACCESS_TOKEN: 'EAANXXXXXXXXXX...',  // Token de sistema (permanente)

  // E-mail da supervisora (recebe alertas de falhas)
  EMAIL_SUPERVISORA: 'supervisora@suaempresa.com.br',

  // Fasts — e-mail do Google Calendar, número WhatsApp (DDI+DDD+número) e cor
  FASTS: {
    'Nome do Fast 1': {
      email: 'fast1@suaempresa.com.br',
      phone: '5511999999991',
      cor:   '#7C3AED',
    },
    'Nome do Fast 2': {
      email: 'fast2@suaempresa.com.br',
      phone: '5511999999992',
      cor:   '#0EA5E9',
    },
    'Nome do Fast 3': {
      email: 'fast3@suaempresa.com.br',
      phone: '5511999999993',
      cor:   '#10B981',
    },
    'DUMMY': {
      email: 'teste@gmail.com',
      phone: '5511999999994',
      cor:   '#F59E0B',
    },
  },

  // Slots de horário exibidos na agenda
  SLOTS: [
    { label: '08:00 – 12:00', inicio: 8,  fim: 12 },
    { label: '13:00 – 17:00', inicio: 13, fim: 17 },
  ],

  TIMEZONE: 'America/Sao_Paulo',

  // Status da pipeline (devem bater com os options do Notion)
  STATUS: {
    AGUARDANDO_BRIEFING: 'Aguardando briefing',
    BRIEFING_RECEBIDO:   'Briefing recebido',
    EM_GRAVACAO:         'Em gravação',
    MATERIAL_ENTREGUE:   'Material entregue',
    EM_EDICAO:           'Em edição',
    CONCLUIDO:           'Concluído',
    CANCELADO:           'Cancelado',
  },
};
