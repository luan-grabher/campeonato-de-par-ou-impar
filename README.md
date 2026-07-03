# Campeonato de Par ou Ímpar Online

Plataforma competitiva de **Par ou Ímpar** no navegador (desktop e mobile).

## Stack
- Next.js
- React
- Supabase + Supabase Auth
- Sem WebSocket
- Sem SSE

## Como rodar
1. Copie `.env.example` para `.env.local`
2. Preencha as variáveis do Supabase
3. Instale dependências: `npm install`
4. Rode o app: `npm run dev`

## Estrutura inicial
- `/` — home com visão geral do produto
- `/login` — tela inicial de autenticação com Supabase Auth
- `/mvp` — resumo do MVP
- `/mvp/partida-rapida` — fluxo da partida rápida
- `/mvp/salas-privadas` — criação de salas privadas
- `/mvp/ranking` — ranking Elo e faixas iniciais
