# Arquitetura Técnica — Campeonato de Par ou Ímpar Online

> Este documento define as regras arquiteturais, decisões de tecnologia, padrões de código e práticas de segurança do projeto. Nada aqui é sugestão — tudo é regra. O código deve seguir este documento à risca.

---

## Stack Tecnológica

| Camada | Tecnologia | Versão Mínima | Justificativa |
|--------|-----------|---------------|---------------|
| Framework Web | Next.js | 16 | SSR, Server Components, Server Actions, React 19 |
| Linguagem | TypeScript | 5.x | strict mode, sem `any`, sem `as` casts |
| Banco de Dados | PostgreSQL (Supabase) | 15 | Realtime embutido, RLS, Auth |
| Autenticação | Supabase Auth | — | JWT + Row Level Security nativo |
| Realtime | Supabase Realtime | — | Broadcast + Presence para partidas em tempo real |
| ORM/Query | Supabase client (server-side) | — | Nenhum ORM adicional; queries diretas via client service role |
| Estilo | CSS Modules + design tokens | — | Sem Tailwind; tokens centralizados em `supabase/design-tokens.sql` |
| Ícones/SVG | Lucide React | — | Ícones consistentes e leves |
| Deploy | Vercel + Supabase | — | Zero infra própria |

### Decisões de Stack

- **Supabase Realtime em vez de WebSocket próprio**: o Realtime já escala horizontalmente, tem broadcast/presence embutido e elimina a necessidade de gerenciar conexões WebSocket manualmente.
- **CSS Modules em vez de Tailwind**: o jogo precisa de efeitos visuais ricos (animações, transições, partículas) que Tailwind penaliza com classes enormes e reutilização limitada. Design tokens no banco permitem temas dinâmicos futuros.
- **Sem ORM**: o Supabase client com service role já provê tipagem segura via `supabase gen types`. Adicionar Prisma/Drizzle seria mais uma camada que pode dessincronizar do schema real.

---

## Estrutura de Pastas

```
/
├── app/                          # Next.js App Router (rotas e layouts)
│   ├── (painel-publico)/         # Layout para páginas acessíveis sem login
│   │   ├── page.tsx              # Home
│   │   ├── partida-rapida-ia/    # Única rota disponível deslogado
│   │   └── login/
│   ├── (painel-logado)/          # Layout para páginas que exigem autenticação
│   │   ├── perfil/
│   │   ├── partida-rapida/
│   │   ├── campeonatos/
│   │   ├── salas-privadas/
│   │   └── ranking/
│   ├── layout.tsx                # Root layout com header e footer
│   └── globals.css               # Reset e tokens CSS globais
│
├── componentes/                  # Componentes React reutilizáveis
│   ├── ui/                       # Design System (átomos)
│   │   ├── Botao.tsx
│   │   ├── CartaoDeJogador.tsx
│   │   ├── PlacarDaPartida.tsx
│   │   ├── CronometroDaRodada.tsx
│   │   ├── ModalDeConfirmacao.tsx
│   │   └── EfeitoDeVitoria.tsx
│   ├── jogo/                     # Componentes específicos do jogo
│   │   ├── TabuleiroDeParOuImpar.tsx
│   │   ├── SeletorDeNumero.tsx
│   │   ├── SeletorDeParidade.tsx
│   │   ├── HistoricoDeRodadas.tsx
│   │   ├── AnimacaoDeRevelacao.tsx
│   │   └── EstatisticasDoAdversario.tsx
│   └── layout/                   # Componentes de estrutura
│       ├── Cabecalho.tsx
│       ├── Rodape.tsx
│       └── BarraDeNavegacao.tsx
│
├── core/                         # Lógica pura do domínio (ZERO dependências React/Next)
│   ├── validacao/                # Toda validação de jogadas
│   │   └── validarJogada.ts
│   ├── calculo/                  # Toda lógica de cálculo
│   │   ├── calcularResultadoDaRodada.ts
│   │   ├── calcularElo.ts
│   │   └── calcularEstatisticasDoJogador.ts
│   ├── tipos/                    # Tipos compartilhados (domain types)
│   │   ├── jogador.ts
│   │   ├── partida.ts
│   │   ├── rodada.ts
│   │   ├── salaPrivada.ts
│   │   ├── campeonato.ts
│   │   └── modoDeJogo.ts
│   └── constantes/               # Constantes do jogo (fonte única da verdade)
│       ├── intervalosDeNumeros.ts
│       ├── faixasDeElo.ts
│       └── pontuacao.ts
│
├── servidor/                     # Lógica server-side (Server Actions, API Routes)
│   ├── acoes/                    # Server Actions
│   │   ├── criarJogada.ts
│   │   ├── confirmarJogada.ts
│   │   ├── entrarNaFilaDePartida.ts
│   │   ├── criarSalaPrivada.ts
│   │   ├── cancelarPartida.ts
│   │   └── finalizarPartida.ts
│   ├── seguranca/                # Middlewares e proteções
│   │   ├── validarTokenDeAcesso.ts
│   │   ├── validarCsrf.ts
│   │   └── rateLimiter.ts
│   └── integracoes/              # Integrações com serviços externos
│       └── supabase/
│           ├── buscarPerfilDoJogador.ts
│           ├── registrarJogadaNoBanco.ts
│           ├── buscarPartidaAtiva.ts
│           └── atualizarEloDoJogador.ts
│
├── hooks/                        # Custom Hooks React
│   ├── usarEstadoDaPartida.ts
│   ├── usarAssinaturaRealtime.ts
│   ├── usarJogadorAutenticado.ts
│   └── usarTimerDaRodada.ts
│
├── supabase/                     # Tudo do Supabase versionado
│   ├── migrations/               # Migrations SQL (numeradas)
│   ├── seed.sql                  # Dados iniciais (faixas de elo, conquistas)
│   ├── functions/                # Supabase Edge Functions ou PostgreSQL functions
│   ├── policies/                 # RLS policies documentadas
│   └── tipos.gen.ts             # Tipos gerados pelo Supabase CLI
│
├── public/                       # Assets estáticos
│   └── imagens/
│
├── .env.example                  # Variáveis de ambiente documentadas
└── ARCHITECTURE.md               # Este arquivo
```

### Regra de Ouro da Estrutura

O diretório `core/` **não pode importar nada de React, Next.js, Supabase, nem qualquer framework ou biblioteca externa**. Ele contém apenas funções puras e tipos. Toda regra de negócio vive aqui. Se uma regra de negócio precisar de banco, HTTP ou UI, a implementação concreta fica em `servidor/` ou `componentes/`, e o core fornece a função pura que valida/calcula.

---

## Reutilização de Código — Fonte Única da Verdade

**Não pode haver duas implementações da mesma lógica de jogo em lugar nenhum do projeto.**

### O que é proibido

- Validar regras do jogo no frontend E no backend com código diferente
- Ter a lógica de "quem venceu a rodada" duplicada entre um hook React e uma Server Action
- Calcular Elo em dois lugares diferentes
- Definir intervalos de números (0–10, 1–2) em mais de um arquivo

### Como garantir

1. Toda regra de negócio vive em **funções puras** dentro de `core/`
2. Server Actions em `servidor/acoes/` chamam essas funções — e **só elas** têm permissão de escrita no banco
3. O frontend **nunca** executa a lógica de resultado. Quando o jogador faz uma jogada, o frontend apenas:
   - Envia os dados brutos para a Server Action
   - Escuta o resultado via assinatura Realtime
   - Exibe o que o servidor devolveu

### Exemplo concreto

```typescript
// core/calculo/calcularResultadoDaRodada.ts
// Esta função É a definição oficial de como uma rodada funciona.
// NUNCA duplicar esta lógica em outro arquivo.
export function calcularResultadoDaRodada(
  numeroDoJogadorPrimeiro: number,
  numeroDoJogadorSegundo: number,
  paridadeEscolhidaPeloPrimeiro: 'par' | 'impar'
): {
  somaDosNumeros: number
  paridadeResultante: 'par' | 'impar'
  primeiroJogadorVenceu: boolean
} {
  const somaDosNumeros = numeroDoJogadorPrimeiro + numeroDoJogadorSegundo
  const paridadeResultante = somaDosNumeros % 2 === 0 ? 'par' : 'impar'
  const primeiroJogadorVenceu = paridadeEscolhidaPeloPrimeiro === paridadeResultante

  return { somaDosNumeros, paridadeResultante, primeiroJogadorVenceu }
}
```

---

## Server-Side é a Única Fonte da Verdade

### Regra Fundamental

O navegador **nunca** decide o resultado de nada. O cliente React é **exclusivamente uma camada de exibição e interação**. Toda decisão de jogo acontece no servidor.

### Fluxo de uma Jogada

```
[Jogador clica "Confirmar"]
       │
       ▼
[Client Component] ──chama Server Action──▶ [Server Action: confirmarJogada]
       │                                          │
       │                                     ┌────┴────┐
       │                                     │ 1. Validar token de acesso
       │                                     │ 2. Validar CSRF
       │                                     │ 3. Verificar se jogador está na partida
       │                                     │ 4. Verificar se já é a vez dele
       │                                     │ 5. Verificar se jogada já foi feita (idempotência)
       │                                     │ 6. Chamar core/validacao/validarJogada.ts
       │                                     │ 7. Escrever no banco (INSERT em rodadas)
       │                                     │ 8. Broadcast Realtime para o oponente
       │                                     └────┬────┘
       │                                          │
       │  ◀── Resposta: { status: "aguardando_oponente" }
       │                                          │
       │  ──(Realtime)──▶ [Quando oponente joga]
       │                     Server calcula resultado
       │                     via core/calculo/calcularResultadoDaRodada.ts
       │                     Escreve resultado no banco
       │                     Broadcast para ambos os jogadores
       │
       ▼
[Client exibe resultado da rodada]
```

### O que o frontend JAMAIS faz

- ❌ Calcular soma dos números
- ❌ Determinar paridade
- ❌ Decidir vencedor da rodada
- ❌ Atualizar Elo
- ❌ Validar se jogada é válida
- ❌ Armazenar estado persistente do jogo (sem localStorage para dados de partida)

### O que o frontend PODE fazer

- ✅ Exibir dados que vieram do servidor
- ✅ Validar entrada do usuário antes de enviar (ex: número entre 0 e 10) — apenas para feedback visual imediato, a validação real é server-side
- ✅ Mostrar animações e efeitos baseados no resultado que o servidor retornou

---

## Segurança

### Proteção de Jogadas (Anti-Replay)

Cada jogada deve ser **idempotente**: apenas a primeira chamada para aquela rodada é aceita.

```typescript
// servidor/seguranca/rateLimiter.ts
// Estratégia: token de rodada único + verificação no banco

// 1. Ao iniciar uma rodada, o servidor gera um tokenJogadaDaRodada único (UUID)
//    e armazena na tabela rodadas (coluna token_de_idempotencia)

// 2. O frontend recebe esse token ao carregar a rodada

// 3. Ao confirmar a jogada, o frontend envia:
//    { tokenJogadaDaRodada, numeroEscolhido, paridadeEscolhida }

// 4. A Server Action verifica:
//    - Token existe e não foi usado ainda
//    - Jogador pertence à partida
//    - É a vez deste jogador
//    - Se qualquer condição falhar → 409 Conflict ou erro

// 5. No INSERT da jogada, usa ON CONFLICT (token) DO NOTHING
//    Se o INSERT retornar 0 linhas afetadas → jogada já foi registrada → retorna sucesso silencioso
```

### CSRF

Next.js já protege Server Actions com CSRF nativo (baseado em cabeçalho `Origin` + `Content-Type`). Além disso:

- Não expor rotas de API que aceitem `application/x-www-form-urlencoded`
- Validar `Origin` e `Referer` em toda ação sensível
- Para futuras API Routes (não Server Actions), usar tokens CSRF explícitos

### Row Level Security (Supabase)

Todas as tabelas do Supabase **devem** ter RLS habilitado. Apenas Server Actions autenticadas com `service_role` podem ignorar RLS. O frontend usa o client anônimo com RLS restritivo:

- `profiles`: jogador só lê/edita o próprio perfil
- `matches`: jogador só vê partidas que participa
- `match_rounds`: jogador só lê rodadas de partidas que participa, e só escreve quando é sua vez
- `queue`: jogador só insere/remove a si mesmo da fila

### Rate Limiting

Implementar em duas camadas:

1. **Supabase**: RLS + triggers para impedir ações repetidas em intervalo curto
2. **Next.js**: middleware de rate limit por IP + userId (ex: upstash/ratelimit ou implementação própria em `servidor/seguranca/rateLimiter.ts`)

### Proteções Adicionais

- Input sanitization: todos os textos (nome, país) passam por limpeza de XSS antes de persistir
- Timeout de rodada: se o jogador não jogar em X segundos, derrota automática (server-side, não confiar no timer do frontend)
- Auditoria: toda jogada tem timestamp e IP registrados para debug/fair play

---

## Banco de Dados — Supabase

### Schema

```sql
-- Extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Perfil estende o auth.users do Supabase
CREATE TABLE perfis (
  id_usuario UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(24) NOT NULL CHECK (char_length(nome) >= 2),
  pais VARCHAR(2), -- código ISO 3166-1 alpha-2
  url_do_avatar TEXT,
  elo INTEGER NOT NULL DEFAULT 1200,
  total_de_vitorias INTEGER NOT NULL DEFAULT 0,
  total_de_derrotas INTEGER NOT NULL DEFAULT 0,
  total_de_partidas INTEGER NOT NULL DEFAULT 0,
  sequencia_atual INTEGER NOT NULL DEFAULT 0,
  maior_sequencia INTEGER NOT NULL DEFAULT 0,
  numero_favorito INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partidas (matchmaking, salas, campeonatos)
CREATE TABLE partidas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modo TEXT NOT NULL CHECK (modo IN ('classico', 'dificil', 'relampago', 'invisivel', 'caos')),
  tipo TEXT NOT NULL CHECK (tipo IN ('partida_rapida', 'sala_privada', 'campeonato')),
  id_do_primeiro_jogador UUID NOT NULL REFERENCES perfis(id_usuario),
  id_do_segundo_jogador UUID REFERENCES perfis(id_usuario), -- NULL enquanto esperando oponente
  id_da_sala UUID REFERENCES salas_privadas(id), -- NULL se não for sala
  id_do_campeonato UUID REFERENCES campeonatos(id), -- NULL se não for campeonato
  status TEXT NOT NULL DEFAULT 'aguardando_jogadores'
    CHECK (status IN ('aguardando_jogadores', 'em_andamento', 'finalizada', 'cancelada')),
  total_de_rodadas_previsto INTEGER NOT NULL CHECK (total_de_rodadas_previsto IN (3, 5, 7)),
  rodada_atual INTEGER NOT NULL DEFAULT 0,
  vencedor_id UUID REFERENCES perfis(id_usuario),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rodadas individuais de cada partida
CREATE TABLE rodadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_da_partida UUID NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
  numero_da_rodada INTEGER NOT NULL CHECK (numero_da_rodada > 0),
  
  -- Jogada do primeiro jogador
  numero_do_primeiro_jogador INTEGER,
  paridade_escolhida_pelo_primeiro TEXT CHECK (paridade_escolhida_pelo_primeiro IN ('par', 'impar')),
  token_de_idempotencia_do_primeiro UUID UNIQUE,
  jogada_do_primeiro_confirmada BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Jogada do segundo jogador
  numero_do_segundo_jogador INTEGER,
  paridade_escolhida_pelo_segundo TEXT CHECK (paridade_escolhida_pelo_segundo IN ('par', 'impar')),
  token_de_idempotencia_do_segundo UUID UNIQUE,
  jogada_do_segundo_confirmada BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Resultado (calculado server-side quando ambos confirmarem)
  resultado_calculado BOOLEAN NOT NULL DEFAULT FALSE,
  vencedor_id UUID REFERENCES perfis(id_usuario),
  soma_dos_numeros INTEGER,
  paridade_resultante TEXT,
  
  UNIQUE(id_da_partida, numero_da_rodada)
);

CREATE TABLE salas_privadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(6) NOT NULL UNIQUE,
  titulo VARCHAR(50) NOT NULL,
  id_do_anfitriao UUID NOT NULL REFERENCES perfis(id_usuario),
  total_de_rodadas INTEGER NOT NULL CHECK (total_de_rodadas IN (3, 5, 7)),
  status TEXT NOT NULL DEFAULT 'aguardando_oponente'
    CHECK (status IN ('aguardando_oponente', 'em_andamento', 'finalizada', 'cancelada')),
  modo_de_jogo TEXT NOT NULL DEFAULT 'classico',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fila_de_partida_rapida (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_do_jogador UUID NOT NULL REFERENCES perfis(id_usuario) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campeonatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  formato TEXT NOT NULL CHECK (formato IN ('mata_mata')),
  total_de_jogadores INTEGER NOT NULL CHECK (total_de_jogadores IN (8, 16, 32, 64)),
  status TEXT NOT NULL DEFAULT 'inscricoes_abertas'
    CHECK (status IN ('inscricoes_abertas', 'em_andamento', 'finalizado', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE participantes_do_campeonato (
  id_do_campeonato UUID NOT NULL REFERENCES campeonatos(id) ON DELETE CASCADE,
  id_do_jogador UUID NOT NULL REFERENCES perfis(id_usuario) ON DELETE CASCADE,
  eliminado_em UUID REFERENCES partidas(id),
  posicao_final INTEGER,
  PRIMARY KEY (id_do_campeonato, id_do_jogador)
);

-- Índices
CREATE INDEX idx_partidas_primeiro_jogador ON partidas(id_do_primeiro_jogador);
CREATE INDEX idx_partidas_segundo_jogador ON partidas(id_do_segundo_jogador);
CREATE INDEX idx_partidas_status ON partidas(status);
CREATE INDEX idx_rodadas_partida ON rodadas(id_da_partida, numero_da_rodada);
CREATE INDEX idx_rodadas_status ON rodadas(resultado_calculado);
```

### Migrations

Toda alteração no schema deve ser uma migration SQL numerada em `supabase/migrations/`. Nunca alterar tabelas manualmente pelo dashboard do Supabase.

### Tipos Gerados

Após aplicar as migrations, rodar `supabase gen types typescript --local > supabase/tipos.gen.ts` e importar os tipos no projeto. Isso garante que o TypeScript reflita exatamente o schema do banco.

---

## Autenticação e Controle de Acesso

### Regras de Login

| Funcionalidade | Exige Login? |
|---------------|:---:|
| Partida rápida contra IA | ❌ Não |
| Partida rápida contra jogador real | ✅ Sim |
| Sala privada | ✅ Sim |
| Campeonato | ✅ Sim |
| Ranking | ✅ Sim |
| Perfil | ✅ Sim |
| Histórico de partidas | ✅ Sim |
| Amigos | ✅ Sim |

### Fluxo de Autenticação

1. Supabase Auth com magic link (email) ou provedores sociais (Google, Discord)
2. Sessão gerenciada via cookies do Supabase (server-side), não localStorage
3. Middleware do Next.js redireciona rotas protegidas se não houver sessão
4. O client nunca tem acesso ao token `service_role`

### Middleware de Rotas

```typescript
// app/middleware.ts
// Protege rotas em (painel-logado) e permite (painel-publico) sem autenticação
// Se o usuário não estiver autenticado e tentar acessar /partida-rapida (não IA),
// redirecionar para /login com callback URL
```

---

## Design System e Experiência Visual

### Filosofia Visual

O jogo deve evocar a mesma energia de um cliente de jogo competitivo: dinâmico, escuro, com cores vibrantes e feedback visual imediato. Referência de tom: **Valorant** (escuro com acentos roxos/azuis/verdes, tipografia bold, animações responsivas).

### Tokens de Design (CSS Custom Properties)

```css
/* app/globals.css — tokens globais */
:root {
  /* Cores base — fundo escuro dramático */
  --corFundoPrincipal: #0f0e17;
  --corFundoSuperficie: #18172a;
  --corFundoElevado: #222140;

  /* Bordas e separadores */
  --corBorda: rgba(255, 255, 255, 0.08);

  /* Texto */
  --corTextoPrincipal: #fffffe;
  --corTextoSecundario: rgba(255, 255, 255, 0.64);
  --corTextoDesabilitado: rgba(255, 255, 255, 0.32);

  /* Paleta de destaque — roxo neon como cor primária */
  --corDestaquePrimario: #7c5cff;
  --corDestaquePrimarioHover: #9b80ff;
  --corDestaqueSecundario: #00d4aa;
  --corDestaqueAlerta: #ff5e7a;

  /* Feedback de jogo */
  --corVitoria: var(--corDestaqueSecundario);
  --corDerrota: var(--corDestaqueAlerta);
  --corEmpate: #ffc857;

  /* Tipografia */
  --fontePrincipal: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --fonteDestaque: 'Inter', ui-sans-serif, system-ui, sans-serif;

  /* Raios de borda */
  --raioPequeno: 8px;
  --raioMedio: 14px;
  --raioGrande: 24px;

  /* Transições */
  --transicaoRapida: 150ms ease;
  --transicaoMedia: 300ms ease;

  /* Sombras */
  --sombraDoCard: 0 4px 24px rgba(0, 0, 0, 0.3);
  --sombraDoDestaque: 0 0 20px rgba(124, 92, 255, 0.3);
}
```

### Componentes do Design System

Todos os componentes de UI ficam em `componentes/ui/` e seguem:

- **Botao**: variantes (primário, secundário, ghost, perigo), loading state, disabled state
- **CartaoDeJogador**: avatar, nome, elo, placar
- **PlacarDaPartida**: exibe pontuação de ambos os jogadores com animação de atualização
- **CronometroDaRodada**: timer regressivo com alerta visual nos últimos segundos
- **ModalDeConfirmacao**: para ações destrutivas (cancelar partida, sair de sala)
- **EfeitoDeVitoria**: overlay de vitória com partículas/animação (CSS keyframes)
- **AnimacaoDeRevelacao**: transição de "jogada oculta" para "jogada revelada" com efeito flip

### Diretrizes de UX para Partidas

- **Tela de escolha**: números grandes e tocáveis (mobile first), com feedback tátil (hover + active state dramático)
- **Revelação**: animação de "virar carta" ou "abrir envelope" para criar suspense
- **Resultado**: splash colorido (verde para vitória, vermelho para derrota) com partículas
- **Entre rodadas**: transição suave de 1-2 segundos para o jogador processar
- **Tela de fim de partida**: estatísticas da partida + botão "Jogar Novamente" + compartilhar
- **Nunca usar loaders genéricos**: em vez de spinner, mostrar placeholder animado do oponente "pensando"

---

## Padrões de Código

### Nomenclatura (OBRIGATÓRIO)

Tudo em português brasileiro. Nomes longos e autoexplicativos. Proibido abreviações.

```typescript
// ✅ Certo
const perfilDoJogadorAutenticado = ...
function validarJogadaDaRodada() ...
function calcularEloAposPartida() ...
interface DadosDaPartidaEmAndamento { ... }

// ❌ Errado
const user = ...
function validate() ...
interface MatchData { ... }
```

Proibido:
- `data`, `dados`, `item`, `result`, `resultado`, `value`, `valor`, `list`, `lista`, `tmp`, `temp`
- Abreviações como `usr`, `cfg`, `msg`, `btn`, `res`
- Nomes genéricos que não descrevem o conteúdo

### TypeScript

- `strict: true` — sem exceções
- `noUncheckedIndexedAccess: true`
- `noImplicitReturns: true`
- Proibido `as` casts — usar type guards ou Zod/zod validation
- Proibido `any` — se um tipo é realmente desconhecido, usar `unknown` com type guard

### Funções

- Uma responsabilidade por função
- Máximo 50 linhas (ideal 5-20)
- Early returns sempre
- Máximo 2 níveis de aninhamento
- Parâmetros booleanos proibidos — criar funções separadas

### Comentários

Proibidos. O código deve se explicar pelos nomes das funções, variáveis e estrutura. Nenhum `// TODO`, `// FIXME`, `// Explicação`.

### Componentes React

- Um componente por arquivo
- Server Components por padrão, Client Components só quando houver interatividade ou hooks
- Todo Client Component explícito com `'use client'`
- Hooks de dados e efeitos no próprio arquivo do componente (não em arquivos separados)

### Imports

Ordenar por:
1. Biblioteca padrão
2. Bibliotecas externas (next, react, supabase)
3. Módulos internos (`core/`, `servidor/`, `componentes/`)
4. Imports relativos (`./`, `../`)

Alfabeticamente dentro de cada grupo.

---

## Partida Rápida Contra IA (Modo Deslogado)

### Regras

- Única funcionalidade acessível sem login
- Jogador pode inserir um nome temporário (não precisa de conta)
- Partida é melhor de 3, intervalo 0-10
- IA Aleatória usa `Math.random()` — executa no servidor, nunca no cliente
- Resultado NÃO persiste no banco (sem perfil para associar)
- Resultado é exibido na tela e descartado ao sair da página
- Se o jogador quiser salvar o resultado, precisa criar conta

### Fluxo Técnico

```
[Jogador deslogado] → Server Action cria partida TEMPORÁRIA
                     (sem id_do_segundo_jogador no banco, 
                      tipo = 'partida_contra_ia', 
                      status = 'modo_anonimo')
                     ↓
Server gera jogadas da IA e calcula resultado
                     ↓
Retorna para o frontend exibir
                     ↓
Nada é persistido se jogador não tem perfil
```

---

## Campeonatos

O modo principal e competitivo da plataforma. Campeonatos são disputas no formato mata-mata com chaveamento gerado pelo servidor.

- Tabela: `campeonatos`
- Componentes: `ListaDeCampeonatos`, `ChaveamentoDoCampeonato`
- URLs: `/campeonatos`
- Server Actions: `criarCampeonato`, `inscreverNoCampeonato`, `avancarFaseDoCampeonato`

### Funcionamento

- Formato mata-mata com 8, 16, 32 ou 64 jogadores
- Todas as partidas melhor de 3
- Final melhor de 5
- Inscrições abrem em horário agendado, fecham quando lotar
- Chaveamento gerado aleatoriamente pelo servidor
- Partidas do campeonato usam o mesmo fluxo de partida normal, mas vinculadas ao campeonato
- Ao final, ranking dos 3 primeiros lugares

---

## IA

### Personagens

Todas as IAs executam **exclusivamente no servidor** (`servidor/integracoes/ia/`). O frontend nunca calcula nenhuma jogada de IA.

| Personalidade | Comportamento | Implementação |
|--------------|---------------|---------------|
| Aleatória | `Math.random()` puro | `core/calculo/jogadaDaIaAleatoria.ts` |
| Teimosa | Sempre o(s) mesmo(s) número(s) | Configurável no banco (tabela de personalidades) |
| Psicológica | Analisa frequência de números do oponente e contra-ataca | Leitura do histórico da partida + função de escolha |
| Caótica | 3 primeiras rodadas previsíveis, depois muda | State machine com toggle de fase |

### IA Psicológica (Exemplo)

```typescript
// core/calculo/jogadaDaIaPsicologica.ts — função pura, sem IO
export function calcularJogadaDaIaPsicologica(
  historicoDeNumerosDoOponente: Array<{ numero: number }>,
  faseDaPartida: 'inicio' | 'meio' | 'final'
): { numeroEscolhido: number; paridadeEscolhida: 'par' | 'impar' } {
  // 1. Calcular frequência de cada número do oponente
  // 2. Escolher o número que o oponente menos usa (ou assumir que ele escolherá o favorito)
  // 3. Com base no número provável do oponente, escolher paridade que vence
  // 4. Retornar jogada
}
```

---

## Versionamento e CI/CD

### Git

- Branch `main` protegida — sem push direto
- Commits em português, descritivos
- Semantic commits: `feat:`, `fix:`, `refactor:`, `chore:`

### CI (GitHub Actions)

- TypeScript strict check
- ESLint com regras de nomenclatura em português
- Testes unitários do `core/` (Vitest)
- Testes de integração das Server Actions
- Validação de que nenhuma regra de negócio roda no client

### Deploy

- Vercel para o Next.js
- Supabase para banco, auth e storage
- Database migrations aplicadas automaticamente via Supabase CLI no CI

---

## Próximos Passos

Este documento deve ser revisado e atualizado conforme o projeto evolui. Nenhuma alteração arquitetural pode ser feita sem antes atualizar este arquivo.

### Checklist de Implementação

- [ ] Criar projeto Next.js 16 com TypeScript strict
- [ ] Configurar Supabase (projeto, auth, migrations iniciais)
- [ ] Implementar `core/` (tipos, constantes, funções puras)
- [ ] Implementar autenticação (login, middleware de rotas)
- [ ] Implementar fila de partida rápida + matchmaking
- [ ] Implementar fluxo de partida (criar jogada, confirmar, broadcast)
- [ ] Implementar partida contra IA (modo anônimo)
- [ ] Implementar salas privadas
- [ ] Implementar ranking e Elo
- [ ] Implementar perfil e estatísticas
- [ ] Implementar campeonatos
- [ ] Design System completo com animações e efeitos
