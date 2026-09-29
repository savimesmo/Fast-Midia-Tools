# Mapa Fast Midia x Clientes

Mapa interativo que visualiza a distribuicao geografica dos clientes atendidos por cada Fast em Manaus, com base nos dados extraidos dos Google Calendars da equipe.

## O que mostra

- **Casas dos Fasts** — localizacao residencial de Rhony, Bea e Gabi
- **Agencia** — sede da Vanguarda Martech
- **Clientes** — pontos proporcionais ao numero de agendamentos, coloridos por Fast responsavel

## Dados

- **Rhony**: 90 clientes mapeados
- **Bea**: 24 clientes mapeados
- **Gabi**: 16 clientes mapeados

Coordenadas obtidas via geocodificacao (Nominatim/OpenStreetMap) a partir dos enderecos nos eventos do Google Calendar.

## Como usar

O mapa precisa ser servido via HTTP (tiles do OpenStreetMap bloqueiam acesso via `file://`).

```bash
# Python 3
cd tools/mapa-clientes
python -m http.server 8090

# Abrir http://localhost:8090
```

## Stack

- [Leaflet.js 1.9.4](https://leafletjs.com/) — biblioteca de mapas
- OpenStreetMap — tiles do mapa base
- DM Sans — tipografia (Google Fonts)
- Dados embutidos no HTML (sem dependencia de API externa)

## Filtros

Clique nos botoes Rhony / Bea / Gabi na barra superior para ligar/desligar a visualizacao de cada Fast.

## Cores

| Elemento | Cor |
|---|---|
| Rhony | `#C41E3A` (vermelho) |
| Bea | `#2563EB` (azul) |
| Gabi | `#059669` (verde) |
| Agencia | `#D97706` (dourado) |
