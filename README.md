# Campeonato de Par ou Ímpar Online

Plataforma competitiva de **Par ou Ímpar** no navegador (desktop e mobile).

## Stack
- Next.js
- React
- Supabase + Supabase Auth
- Sem WebSocket
- Sem SSE

## Como rodar
1. Copie `.env.example` para `.env.local` se quiser usar Supabase
2. Preencha as variáveis do Supabase se houver backend configurado
3. Instale dependências: `npm install`
4. Rode o app: `npm run dev`

## Estrutura inicial
- `/` — home com visão geral do produto
- `/login` — tela inicial de autenticação com Supabase Auth
- `/mvp` — resumo do MVP
- `/mvp/partida-rapida` — fluxo da partida rápida
- `/mvp/salas-privadas` — criação de salas privadas
- `/mvp/ranking` — ranking Elo e faixas iniciais

## Checklist de implementação
### Concluído no MVP atual
- [x] Login com perfil persistido no navegador
- [x] Suporte opcional a Supabase Auth quando configurado
- [x] Partida rápida jogável com IA Aleatória
- [x] Salas privadas com link compartilhável e entrada por código
- [x] Sincronização do estado entre abas do navegador
- [x] Ranking Elo com estatísticas reais do perfil

### Próximas melhorias
- [ ] Multiplayer com backend dedicado
- [ ] Reconexão automática entre dispositivos diferentes
- [ ] Torneios e temporadas competitivas
- [ ] Modos sociais e observadores
