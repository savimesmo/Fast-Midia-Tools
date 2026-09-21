# Deploy do Sistema Fest Mídia — Passo a Passo

## Pré-requisitos (Fase 0 — resolver antes de qualquer deploy)

- [ ] Confirmar qual ferramenta gera o agendamento (Calendly, cal.com, Google Calendar?)
- [ ] Ter o Notion integration token (`secret_...`) com acesso de escrita na database
- [ ] Ter o número de WhatsApp Business verificado na Meta + phone_number_id + access_token
- [ ] Ter o ID da pasta "Fest Mídia — Jobs" no Drive (da URL da pasta)
- [ ] Criar o Google Forms de briefing (campos detalhados em `forms-briefing-campos.md`)

---

## Passo 1 — Criar o projeto Google Apps Script

1. Acesse [script.google.com](https://script.google.com) logado com a conta Vanguarda
2. **Novo projeto** → Renomear para "Fest Mídia — Automação"
3. Copie cada arquivo `.gs` desta pasta para o projeto (um arquivo por aba)
4. Na aba `config.gs`, preencha **todos** os campos de `CONFIG`:
   - `NOTION_TOKEN`
   - `NOTION_DATABASE_ID` (já está: `27d9e64923064759af837a5448783f6f`)
   - `DRIVE_PARENT_FOLDER_ID` (ID da pasta "Fest Mídia — Jobs" no Drive)
   - `FORMS_ID` e `FORMS_ENTRY_JOB_ID` (após criar o Forms)
   - `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_ACCESS_TOKEN`
   - Números de WhatsApp de cada Fast (formato: `5511999998888`)

---

## Passo 2 — Publicar como Web App (para webhook de agendamento)

1. No Apps Script: **Implantar → Nova implantação**
2. Tipo: **App da Web**
3. Executar como: **Eu** (a conta Vanguarda)
4. Quem tem acesso: **Qualquer pessoa** (para o Calendly/cal.com poder chamar)
5. Copie a URL gerada — você vai cadastrar esta URL no painel do Calendly/cal.com como webhook

### Configurar webhook no Calendly
- Conta Calendly → Integrações → Webhooks → + Novo webhook
- URL: a URL do Web App acima
- Evento: `invitee.created`

### Configurar webhook no cal.com
- Configurações → Desenvolvedor → Webhooks → + Adicionar webhook
- URL: a URL do Web App acima
- Eventos: `BOOKING_CREATED`

### Alternativa: trigger do Google Calendar
- Se o agendamento for via Google Calendar Appointment Schedule, não precisa de webhook
- Vá em Triggers → + Adicionar → `onCalendarEvent` → Calendário → Evento atualizado

---

## Passo 3 — Instalar trigger periódico do validador de comprovante

1. No Apps Script: **Triggers (⏱)** → **+ Adicionar trigger**
2. Função: `validarComprovantes99`
3. Origem: Por tempo
4. Tipo: Diário
5. Horário: 08:00–09:00

---

## Passo 4 — Instalar trigger do keep-alive WhatsApp

1. Triggers → + Adicionar → `waKeepAlive`
2. Tipo: Diário → 08:30–09:00 (dias úteis)

> **Alternativa de custo zero:** pedir que cada Fast mande "bom dia" por WhatsApp todo início de expediente — abre a janela de serviço sem custo de template. Nesse caso, não precisa do keep-alive automático.

---

## Passo 5 — Configurar trigger do Google Forms

1. Abra o Google Forms de briefing
2. Ícone dos 3 pontos (⋮) → **Script do editor**
3. Copie o conteúdo de `briefing.gs` para o editor do Forms
4. Copie também os arquivos `config.gs`, `notion.gs`, `whatsapp.gs` (são dependências)
5. Triggers → + Adicionar → `onFormSubmit` → Envio de formulário

---

## Passo 6 — Teste de ponta a ponta

1. Faça um agendamento de teste na ferramenta usada
2. Verifique:
   - Pasta criada no Drive com subpastas "Material Bruto" e "Briefing"
   - Página criada no Notion com status "Aguardando briefing"
   - WhatsApp recebido pelo Fast (ou e-mail se falhou)
3. Preencha o Forms de briefing via o link recebido
4. Verifique:
   - Status no Notion mudou para "Briefing recebido"
   - Campo Observações preenchido
   - Se marcou 99, checkbox "Corrida 99 Solicitada" ativado
5. Mude o status para "Concluído" sem anexar comprovante → aguarde o validador diário (ou chame `verificarAgora()`) → status deve voltar e e-mail de aviso deve chegar

---

## Variáveis a coletar (Fase 0)

| Variável | Onde encontrar |
|---|---|
| `NOTION_TOKEN` | notion.so → Configurações → Integrações → Criar integração interna |
| `DRIVE_PARENT_FOLDER_ID` | URL da pasta: `drive.google.com/drive/folders/ID_AQUI` |
| `FORMS_ID` | URL do Forms: `docs.google.com/forms/d/FORMS_ID/edit` |
| `FORMS_ENTRY_JOB_ID` | Pré-visualize o Forms → inspecione o campo "ID do Job" → atributo `name` do input |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Business Manager → WhatsApp → Número |
| `WHATSAPP_ACCESS_TOKEN` | Meta Business Manager → Usuário do sistema → Token permanente |
