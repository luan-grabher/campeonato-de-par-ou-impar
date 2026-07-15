# AGENTS.md — Campeonato de Par ou Ímpar Online

> Este arquivo contém tudo que um agente de IA precisa saber para trabalhar neste projeto. Leia antes de qualquer alteração.

---

## Identidade do Projeto

Campeonato de Par ou Ímpar Online — transformar um meme brasileiro em um jogo real no navegador. Partidas rápidas (<1min), competitivas, com ranking Elo, campeonatos, IA, modos alternativos e futuramente premiações.

---

## Stack Tecnológica (Regras, não sugestões)

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16 |
| Linguagem | TypeScript strict | 5.x |
| Banco | PostgreSQL (Supabase) | 15 |
| Auth | Supabase Auth (JWT + RLS) | — |
| Realtime | Supabase Realtime (broadcast + presence) | — |
| ORM | Nenhum — Supabase client direto com service role | — |
| Estilo | CSS Modules + design tokens globais | — |
| Ícones | Lucide React | — |
| Deploy | Vercel + Supabase | — |

### Decisões que o agente NÃO pode questionar

- **Sem Tailwind**: CSS Modules + tokens no `:root`. UI com efeitos ricos (animações, partículas).
- **Sem ORM**: Supabase client direto. Tipos gerados via `supabase gen types`.
- **Sem WebSocket próprio**: Supabase Realtime já escala.
- **Server Components por padrão**, Client Components só com `'use client'`.

---

## Estrutura de Pastas (Obrigatória)

```
/
├── app/                          # Next.js App Router
│   ├── (painel-publico)/         # Rotas sem login
│   ├── (painel-logado)/          # Rotas protegidas
│   ├── layout.tsx
│   └── globals.css
├── componentes/
│   ├── ui/                       # Design System (átomos)
│   ├── jogo/                     # Componentes do jogo
│   └── layout/                   # Header, footer, nav
├── core/                         # ⚡ Lógica PURA do domínio
│   ├── validacao/
│   ├── calculo/
│   ├── tipos/
│   └── constantes/
├── servidor/
│   ├── acoes/                    # Server Actions
│   ├── seguranca/                # Middlewares, rate limit
│   └── integracoes/supabase/     # Queries ao banco
├── hooks/                        # Custom hooks React
├── supabase/
│   ├── migrations/               # SQL numeradas
│   ├── seed.sql
│   ├── functions/
│   ├── policies/                 # RLS documentadas
│   └── tipos.gen.ts             # Tipos gerados
└── public/
```

### Regra de Ouro da Estrutura

**`core/` não pode importar React, Next.js, Supabase, nem framework algum.** Apenas funções puras e tipos. Toda regra de negócio vive aqui. Se precisar de banco/HTTP/UI, a implementação concreta vai em `servidor/` ou `componentes/`.

---

## Fonte Única da Verdade

**Não pode haver duas implementações da mesma lógica.** Toda regra de negócio é uma função pura em `core/`. Server Actions chamam essas funções. O frontend NUNCA executa lógica de resultado — só envia dados brutos para a Server Action e escuta o resultado via Realtime.

### O que o frontend JAMAIS faz

- ❌ Calcular soma, paridade, vencedor, Elo
- ❌ Validar jogada (só validação visual pré-envio)
- ❌ Armazenar estado persistente de partida (sem localStorage)
- ❌ Calcular jogada de IA

### O que APENAS o servidor faz

- ✅ Decidir resultado da rodada
- ✅ Validar jogada (regras reais)
- ✅ Atualizar Elo
- ✅ Gerar jogada de IA
- ✅ Gerenciar timeouts de rodada

---

## Nomenclatura (OBRIGATÓRIO)

**Tudo em português brasileiro.** Nomes longos e autoexplicativos. Proibido abreviações.

```typescript
// ✅ Certo
const perfilDoJogadorAutenticado = ...
function validarJogadaDaRodada() ...
function calcularEloAposPartida() ...
interface DadosDaPartidaEmAndamento { ... }

// ❌ Errado — rejeitar em code review
const user = ...
function validate() ...
function calcElo() ...
interface MatchData { ... }
```

Proibido: `data`, `dados`, `item`, `result`, `resultado`, `value`, `valor`, `list`, `lista`, `tmp`, `temp`, `usr`, `cfg`, `msg`, `btn`, `res`.

---

## TypeScript — Configuração

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

- ❌ Proibido `as` casts — usar type guards ou validação em runtime
- ❌ Proibido `any` — usar `unknown` com type guard
- ✅ `satisfies` é permitido
- ✅ Non-null assertion (`!`) só com comentário justificando (e mesmo assim, evitar)

---

## Funções

- Uma responsabilidade por função
- Máximo 50 linhas (ideal 5–20)
- Early returns sempre
- Máximo 2 níveis de aninhamento
- ❌ Parâmetros booleanos — criar funções separadas

---

## Componentes React

- Um componente por arquivo
- Server Components por padrão; Client Components só com `'use client'`
- Hooks declarados no mesmo arquivo do componente

---

## Imports (Ordem Obrigatória)

1. Biblioteca padrão (Node.js)
2. Bibliotecas externas (next, react, supabase/..., lucide-react)
3. Módulos internos (`core/`, `servidor/`, `componentes/`, `hooks/`)
4. Imports relativos (`./`, `../`)

Alfabético dentro de cada grupo.

---

## Banco de Dados

### Regras

- Toda migration em `supabase/migrations/NNN_nome.sql`
- RLS habilitado em TODAS as tabelas
- Apenas Server Actions (com service role) bypassam RLS
- Cliente anônimo usa RLS restritivo (só vê o próprio perfil, só lê partidas que participa)
- Tabelas seguem nomes em português: `perfis`, `partidas`, `rodadas`, `salas_privadas`, `fila_de_partida_rapida`, `campeonatos`
- Colunas com `snake_case` (PostgreSQL nativo) — o Supabase client traduz pra camelCase se configurado

### Schema Essencial (visão geral)

- `perfis` — estende `auth.users`, contém elo, stats
- `partidas` — matchmaking, salas, campeonatos
- `rodadas` — jogadas individuais com idempotência via token UUID único
- `salas_privadas` — código de 6 chars, configurações
- `fila_de_partida_rapida` — fila de matchmaking
- `campeonatos` + `participantes_do_campeonato` — mata-mata

---

## Segurança — Regras Rígidas

### Anti-Replay (Idempotência)

Cada rodada gera um `token_de_idempotencia` UUID único. O INSERT usa `ON CONFLICT (token) DO NOTHING`. Se 0 linhas afetadas, jogada já foi registrada → sucesso silencioso.

### CSRF

Next.js protege Server Actions nativamente. Nunca expor rotas que aceitem `application/x-www-form-urlencoded`. Validar `Origin` + `Referer`.

### Rate Limit

Duas camadas: (1) Supabase RLS + triggers, (2) middleware Next.js por IP + userId.

### Timeout

Derrota automática é server-side — nunca confiar no timer do frontend.

---

## Partida Contra IA (Modo Anônimo)

- Única funcionalidade sem login
- Nome temporário (não persiste)
- IA roda no servidor com `Math.random()`
- Resultado NÃO persiste no banco
- Se quiser salvar, precisa criar conta

---

## Git e Commits

- `main` protegida — sem push direto
- Commits em português, descritivos
- Prefixos: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`
- Commits pequenos e atômicos

---

## CI (GitHub Actions — Futuro)

- TypeScript strict check obrigatório
- ESLint com regra de nomenclatura pt-BR
- Testes unitários do `core/` (Vitest)
- Testes de integração das Server Actions
- Validação: nenhuma regra de negócio roda no client

---

## O que o Agente DEVE Fazer Antes de Codar

1. **Ler este AGENTS.md** (você está aqui — ok)
2. **Ler ARCHITECTURE.md** para regras arquiteturais completas
3. **Ler Escopo.md** para entender o produto
4. **Verificar codegraph** se houver código existente
5. **Seguir a estrutura de pastas** sem criar arquivos fora dela
6. **Usar português** em nomes, comentários (quando inevitáveis), commits
7. **Manter core/ puro** — sem dependências de framework
8. **Nunca duplicar lógica** — se algo já existe em core/, reutilizar

---

## Armadilhas Comuns (Ler Antes de Errar)

| Situação | O que fazer |
|----------|-------------|
| Precisa de um número aleatório no cliente? | ❌ Não. Toda aleatoriedade (IA, sorteio de paridade) roda no servidor. |
| Query no banco dentro de um componente? | ❌ Não. Server Action ou Server Component. |
| Dois arquivos com lógica similar? | ❌ Extrair para `core/`. |
| Jogador fez jogada, quer exibir resultado? | ✅ Escutar canal Realtime. O servidor decide quando e o que revelar. |
| Precisa de um hook com efeito colateral? | ✅ Client Component com `'use client'` + hook separado em `hooks/`. |
| Nome em inglês parece mais claro? | ❌ Não. O projeto é em português. Nomes longos são preferíveis a inglês. |
| ``as`` cast resolve rápido um tipo? | ❌ Não. Validar em runtime ou usar type guard. |
| ``any`` resolve rápido? | ❌ `unknown` + type guard. Sempre. |
