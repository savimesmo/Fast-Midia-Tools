# Proposta: Rastreamento em Tempo Real dos Fasts

> **Status**: Proposta  
> **Prioridade**: Media  
> **Dependencia**: Aprovacao da lideranca + acesso ao Supabase/Vercel da Vanguarda  
> **Autor**: Diana Savi  
> **Data**: Setembro 2026

---

## Problema

Hoje nao ha visibilidade sobre a localizacao dos Fasts durante o expediente. A supervisora nao sabe:

- Se o Fast esta a caminho do cliente ou ja chegou
- Se a rota do dia esta sendo cumprida
- Qual Fast esta mais perto de um cliente para um job urgente

O mapa de clientes (`tools/mapa-clientes/`) resolve a visualizacao **estatica** — mostra onde os clientes ficam e quem atende cada um. Mas falta a camada **dinamica**: onde cada Fast esta agora.

---

## Solucao proposta

Adicionar rastreamento GPS em tempo real ao ecossistema Fast Midia Tools, usando a infraestrutura que a Vanguarda ja possui.

### Arquitetura

```
+------------------+       HTTPS POST        +------------------+
|   OwnTracks      | ---------------------> |  Vercel API Route |
|   (celular Fast) |    lat/lng a cada 30s   |  /api/location    |
+------------------+                         +--------+---------+
                                                      |
                                                      | INSERT
                                                      v
                                             +------------------+
                                             |    Supabase      |
                                             |  fast_locations  |
                                             +--------+---------+
                                                      |
                                                      | Realtime (WebSocket)
                                                      v
                                             +------------------+
                                             |   Dashboard      |
                                             |   Leaflet + WS   |
                                             |   (Vercel host)  |
                                             +------------------+
```

### Componentes

#### 1. App de tracking no celular: OwnTracks

[OwnTracks](https://owntracks.org/) e um app gratuito e open source, disponivel na App Store e Play Store, projetado para rastreamento de localizacao em background.

**Por que OwnTracks:**
- Background tracking real no iOS (usa `CLLocationManager` nativo)
- Zero desenvolvimento mobile — ja existe e e mantido
- Configuravel: frequencia de envio, precisao, modo bateria
- Suporta envio via HTTP POST para endpoint customizado
- Funciona em Android e iOS

**Configuracao por Fast:**
- Instalar OwnTracks
- Configurar modo HTTP (nao MQTT)
- URL do endpoint: `https://<dominio>/api/location`
- Autenticacao: header com token unico por Fast

#### 2. API Route (Vercel)

Endpoint serverless que recebe o POST do OwnTracks, valida o token do Fast e grava no Supabase.

```
POST /api/location
Headers: Authorization: Bearer <FAST_TOKEN>
Body: { "_type": "location", "lat": -3.08, "lon": -60.02, "tst": 1727600000 }
```

**Responsabilidades:**
- Validar token do Fast
- Extrair lat/lng/timestamp
- Upsert na tabela `fast_locations` do Supabase
- Retornar 200 OK

Estimativa: ~40 linhas de codigo.

#### 3. Banco de dados (Supabase)

```sql
CREATE TABLE fast_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fast_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy REAL,
  battery REAL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indice para busca rapida por Fast
CREATE UNIQUE INDEX idx_fast_locations_name ON fast_locations (fast_name);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE fast_locations;
```

Uma linha por Fast, atualizada a cada 30 segundos. Tabela minimalista, sem historico (MVP).

**Row Level Security:**
- API Route (service role): pode escrever
- Dashboard (anon role): pode ler

#### 4. Dashboard (Vercel)

Evolucao do mapa de clientes existente (`tools/mapa-clientes/`), hospedado na Vercel. Adiciona:

- Marcadores animados mostrando a posicao ao vivo de cada Fast
- Indicador de "ultima atualizacao" por Fast
- Supabase Realtime subscription — atualiza sem refresh

```javascript
// Pseudo-codigo do subscribe
const channel = supabase
  .channel('fast-locations')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'fast_locations' },
    (payload) => {
      const { fast_name, lat, lng } = payload.new;
      updateFastMarker(fast_name, lat, lng);
    }
  )
  .subscribe();
```

---

## Stack

| Camada | Tecnologia | Custo |
|---|---|---|
| App celular | OwnTracks (gratuito) | R$ 0 |
| API | Vercel Serverless (licenca Vanguarda) | Ja incluso |
| Banco + Realtime | Supabase (licenca Vanguarda) | Ja incluso |
| Dashboard | Leaflet + Supabase JS (Vercel) | Ja incluso |

**Custo adicional: R$ 0** — usa apenas infraestrutura ja contratada.

---

## Integracao com o ecossistema existente

O rastreamento complementa o sistema de agendamento (Apps Script) sem modifica-lo:

| Ferramenta existente | Como se conecta |
|---|---|
| Agenda web (GAS) | Supervisora agenda o job → dashboard mostra se o Fast esta proximo ao cliente |
| Mapa de clientes | Base visual — o dashboard adiciona a camada de posicao em tempo real |
| Google Calendar | Eventos do dia podem ser sobrepostos no dashboard |
| Notion (jobs) | Link do job pode aparecer no popup do marcador do Fast |

---

## Plano de implementacao

### Fase 1 — MVP (1-2 dias de desenvolvimento)

1. Criar tabela `fast_locations` no Supabase
2. Criar API Route `/api/location` na Vercel
3. Instalar OwnTracks no celular de 1 Fast (piloto)
4. Adaptar o mapa de clientes para mostrar posicao ao vivo
5. Deploy do dashboard na Vercel

### Fase 2 — Producao (1 dia)

6. Configurar OwnTracks nos 3 Fasts
7. Adicionar autenticacao por Fast (tokens individuais)
8. Conectar dominio personalizado (ex: `mapa.vanguardamartech.com.br`)

### Fase 3 — Melhorias (opcional)

9. Historico de posicoes (trilha do dia)
10. Sobreposicao com eventos do Google Calendar
11. Alertas: Fast parado por muito tempo, fora da area de Manaus
12. Integracao com Notion: mostrar job atual do Fast no popup

---

## Riscos e mitigacoes

| Risco | Mitigacao |
|---|---|
| Fast desliga o OwnTracks | Dashboard mostra "ultima atualizacao" — supervisora identifica rapidamente |
| iOS mata o app em background | OwnTracks usa APIs nativas (CLLocationManager) que o iOS permite em background — nao e PWA |
| Consumo de bateria | OwnTracks tem modo "economico" (atualiza por mudanca de regiao, nao por tempo) |
| Privacidade dos Fasts | Rastreamento apenas em horario de expediente — OwnTracks suporta regras automaticas |

---

## Decisoes pendentes (para a lideranca)

1. **Dominio**: usar subdominio da Vanguarda ou URL generica da Vercel?
2. **Acesso**: quem alem da supervisora pode ver o dashboard?
3. **Horario**: rastreamento somente em horario comercial (08-18h) ou sempre?
4. **Historico**: manter trilha dos ultimos 7 dias ou apenas posicao atual?
5. **Projeto Supabase**: usar o projeto existente da Vanguarda ou criar um dedicado?

---

## Proximos passos

Apos aprovacao da lideranca:

1. Obter acesso ao projeto Supabase da Vanguarda (URL + chaves)
2. Obter acesso ao projeto Vercel da Vanguarda (ou criar sub-projeto)
3. Iniciar Fase 1 do desenvolvimento
