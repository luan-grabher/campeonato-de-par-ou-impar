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

## Checklist de implementação por prioridade
### Prioridade 1 — núcleo do produto
- [ ] Implementar autenticação real com Supabase Auth
- [ ] Criar persistência de dados para usuários, partidas e resultados
- [ ] Ligar o fluxo de login ao estado autenticado do app

### Prioridade 2 — jogabilidade online
- [ ] Implementar matchmaking da partida rápida
- [ ] Criar salas privadas funcionais com link compartilhável
- [ ] Sincronizar o estado da partida entre jogadores

### Prioridade 3 — progressão competitiva
- [ ] Calcular e atualizar ranking Elo após cada partida
- [ ] Exibir estatísticas reais do perfil
- [ ] Salvar histórico de partidas e sequência de vitórias

### Prioridade 4 — acabamento do MVP
- [ ] Tratar reconexão, desistência e fim de partida
- [ ] Validar regras e limites de cada modo de jogo
- [ ] Revisar a experiência mobile-first e os estados vazios
