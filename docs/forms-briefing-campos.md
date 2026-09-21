# Google Forms — Briefing de Gravação Fest Mídia

Crie o form em: docs.google.com/forms → Novo formulário → Renomear "Briefing de Gravação — Fest Mídia"

## Campos (nessa ordem exata)

| # | Tipo | Pergunta | Obrigatório | Observação |
|---|---|---|---|---|
| 1 | Resposta curta | ID do Job (não altere) | Não | Campo técnico — será pré-preenchido pela automação via URL. Instrução: "Não altere este campo." |
| 2 | Resposta curta | Seu nome (Fast) | Sim | |
| 3 | Resposta curta | Nome do cliente | Sim | |
| 4 | Data e hora | Data e horário confirmado | Sim | |
| 5 | Parágrafo | Local da gravação (endereço completo) | Sim | |
| 6 | Parágrafo | Roteiro / instruções do job | Sim | |
| 7 | Upload de arquivo | Referência visual (opcional) | Não | Permite imagem/PDF, máx 10MB |
| 8 | Parágrafo | Observações do cliente | Não | |
| 9 | Múltipla escolha | Precisa de transporte (99)? | Sim | Opções: Sim / Não |

## Após criar os campos

1. Clique nos 3 pontos (⋮) → Obter link pré-preenchido
2. Preencha o campo "ID do Job" com um valor qualquer (ex: `EXEMPLO`)
3. Clique em "Obter link" — o link vai ter algo como `...?entry.1234567890=EXEMPLO`
4. O número `1234567890` é o `FORMS_ENTRY_JOB_ID` — copie e coloque no `config.gs`

## Aparência sugerida

- Cor do cabeçalho: roxo/vinho (padrão Vanguarda)
- Descrição: "Preencha antes de cada gravação. O link da pasta de ingest foi enviado junto com este link — suba o material lá após gravar."
