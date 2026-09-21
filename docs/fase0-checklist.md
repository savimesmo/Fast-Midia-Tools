# Fase 0 — Checklist de Descoberta (resolver antes do deploy)

Cada item abaixo bloqueia pelo menos uma parte do sistema. Marque conforme resolve.

---

## 🔴 Bloqueador: ferramenta de agendamento

**Pergunta:** O que está por trás do Linktree de agendamento — Calendly, cal.com, Google Calendar Appointment Schedule, ou outro?

- [ ] Identificar a ferramenta (perguntar a quem configurou o Linktree ou verificar os links)
- [ ] **Se Calendly:** tem acesso de admin à conta? Webhooks ficam em Integrações → Webhooks (plano Teams ou superior exige upgrade)
- [ ] **Se cal.com:** qual plano? Webhooks disponíveis a partir do plano gratuito
- [ ] **Se Google Calendar Appointment Schedule:** não precisa de webhook — o trigger nativo do Apps Script resolve

**Impacto se não resolver:** o trigger de novo agendamento não dispara automaticamente. Workaround manual: supervisor cria o registro no Notion manualmente por enquanto.

---

## 🔴 Bloqueador: Notion integration token

**Pergunta:** Existe uma integração interna do Notion já criada para este workspace?

- [ ] Acessar notion.so → Configurações → Conexões → Criar nova integração
- [ ] Nome sugerido: "Fest Mídia Automação"
- [ ] Permissões necessárias: ler/escrever conteúdo, ler usuários
- [ ] Copiar o token `secret_...` e guardar em lugar seguro
- [ ] **Importante:** conectar a integração à database "Fest Mídia — Controle de Jobs" (abrir a database no Notion → ⋮ → Conexões → adicionar a integração)

**Impacto se não resolver:** nada escreve no Notion.

---

## 🟡 Necessário: Google Drive — pasta-mãe

- [ ] Criar a pasta "Fest Mídia — Jobs" no Drive (se não existir)
- [ ] Copiar o ID da pasta da URL (`drive.google.com/drive/folders/ID_AQUI`)
- [ ] Verificar que a conta que vai rodar o Apps Script tem acesso de Editor a essa pasta

---

## 🟡 Necessário: WhatsApp Business

**Pergunta:** Já existe um número de WhatsApp Business verificado da Vanguarda/Fest Mídia?

- [ ] **Se sim:** pegar o `phone_number_id` e gerar um token permanente via Meta Business Manager (Usuários do sistema → Adicionar usuário do sistema → Gerar token → selecionar o app e a permissão `whatsapp_business_messaging`)
- [ ] **Se não:** iniciar o processo de verificação em business.facebook.com → WhatsApp → Começar. Leva 2–5 dias úteis. Fazer isso o quanto antes.
- [ ] Decidir se vai usar keep-alive automático (template pago ~R$0,03/mensagem) ou processo manual (Fast manda "bom dia" todo dia)

**Impacto se não resolver:** notificações caem para e-mail por enquanto — funciona, mas é menos ágil para o Fast.

---

## 🟢 Sem bloqueio: Google Forms

- [ ] Criar o Forms conforme `forms-briefing-campos.md`
- [ ] Copiar o `FORMS_ID` e o `FORMS_ENTRY_JOB_ID`

Pode fazer antes de ter os outros itens resolvidos.

---

## 🟢 Sem bloqueio: Google Workspace

- [ ] Confirmar se a conta é Google Workspace pago ou conta pessoal (@gmail)
- **Workspace Business:** Drive API, Forms API e Apps Script sem restrição — ok para tudo aqui
- **Conta pessoal:** Apps Script funciona, mas pode ter limites de quota (100 emails/dia, 20K URL Fetch/dia) — suficiente para o volume Fest Mídia

---

## Resumo de contato / responsável

| Item | Quem pode resolver | Prazo sugerido |
|---|---|---|
| Ferramenta de agendamento | Quem criou o Linktree / analista | Semana de 22/09 |
| Notion token | Admin do workspace Notion (Vanguarda) | Semana de 22/09 |
| WhatsApp Business | Diana / TI / Breno (aprovação) | Iniciar imediatamente se ainda não existe |
| Pasta Drive | Diana | Pode fazer agora |
| Google Forms | Diana / Claude Code | Pode fazer agora |
