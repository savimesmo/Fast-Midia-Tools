# Deploy — Fast Mídia Agendamento

> Para o setup completo desde o zero, leia o `README.md` na raiz do repositório.
> Este arquivo cobre o fluxo de deploy via clasp para quem já tem o ambiente configurado.

---

## Workflow de deploy

### Primeira vez

```bash
# 1. Autenticar com a conta Google correta (a que tem acesso aos calendários)
clasp login

# 2. Vincular ao projeto GAS existente (edite .clasp.json com o scriptId)
# ou criar um novo:
clasp create --title "Fast Midia - Agendamento" --type webapp

# 3. Garantir que config.gs existe e está preenchido
cp config.exemplo.gs config.gs
# Editar config.gs com os valores reais

# 4. Subir código
clasp push --force

# 5. Criar deploy
clasp deploy --description "v1.0"
```

### Atualizações normais

```bash
clasp push --force
clasp deploy --description "descrição da mudança"
```

> **IMPORTANTE:** sempre use `clasp deploy` sem `--deploymentId`. Atualizar um deploy existente causa cache no GAS — a versão nova pode não ser servida mesmo após o push.

---

## Verificar conta autenticada

```bash
clasp show-authorized-user
```

Deve mostrar a conta correta (dog.smf@gmail.com para este projeto).

---

## Listar deploys existentes

```bash
clasp deployments
```

---

## Abrir o editor GAS no navegador

```bash
clasp open-script
```

---

## Ver logs de execução em tempo real

```bash
clasp tail-logs
```

---

## Configurar triggers (após primeiro deploy)

Faça no editor GAS (ícone ⏱ → + Adicionar trigger):

| Função | Tipo | Horário |
|---|---|---|
| `waKeepAlive` | Diário | 08:30–09:00 |
| `validarComprovantes99` | Diário | 08:00–09:00 |

O trigger `onFormSubmit` fica no projeto do Google Forms de briefing — não aqui.

---

## Testar WhatsApp

Selecione `testarWhatsApp` no dropdown do editor GAS e clique ▶ Executar.
O log mostra `OK` (token válido + número DUMMY recebeu) ou `FALHOU: WhatsApp API XXX: ...` com o erro exato.

---

## Erros comuns

| Erro | Causa | Solução |
|---|---|---|
| `Skipping push.` | Nenhuma mudança detectada | Use `clasp push --force` |
| `401` no WA | Token expirado | Gerar novo token no Meta (Etapa 1 ou token de sistema) |
| `131030` no WA | Número não verificado no sandbox | Adicionar na lista de destinatários de teste **ou** migrar para produção com número dedicado |
| Grid vazio sem linhas | Calendário não compartilhado com a conta de deploy | Compartilhar o calendário do Fast com dog.smf@gmail.com |
| Página com erro de acesso | `access: DOMAIN` com conta Gmail | Confirmar `access: ANYONE` no `appsscript.json` |
