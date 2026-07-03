# Campeonato de Par ou Ímpar Online

Plataforma competitiva de **Par ou Ímpar** no navegador (desktop e mobile), inspirada no meme: _"não posso, tenho campeonato de par ou ímpar online"_.

## Objetivo do projeto

- Partidas com duração menor que 1 minuto.
- Curva de aprendizado em menos de 10 segundos.
- Interface simples com foco em partidas rápidas e repetíveis.
- Competitividade baseada em leitura de padrões do adversário.

## Plataforma e stack

- Web (desktop e mobile)
- **Next.js**
- **React**
- **Supabase + Supabase Auth**
- **Não usar WebSocket**
- **Não usar SSE**

## Sistema de partidas

### Partida rápida
- Busca automática de adversário.
- Formato: melhor de 3.

### Partida personalizada
- Sala privada com link para amigos.
- Configurações:
  - melhor de 3
  - melhor de 5
  - melhor de 7
  - escolha do modo

### Torneios
- Formato mata-mata (8, 16, 32, 64 jogadores).
- Fases: oitavas, quartas, semifinal e final.
- Regras:
  - partidas melhor de 3
  - final melhor de 5
- Possibilidade de torneios automáticos por horário.

## Modos de jogo

### Clássico
- Jogador escolhe Par ou Ímpar e um número.
- Após confirmação de ambos:
  - revelação simultânea
  - soma dos números
  - verificação de paridade
  - definição do vencedor

### Intervalos de números
- Tradicional: 1 a 2.
- Expandido: 0 a 10.
- Futuro: 0 a 20 e intervalos personalizados.

### Difícil
Mostrar estatísticas completas do adversário durante a partida:
- frequência por número
- número mais utilizado
- frequência de pares e ímpares
- sequência atual
- taxa de repetição

### Relâmpago
- Tempo de jogada curto (3s ou 5s).
- Sem escolha no tempo:
  - derrota automática, ou
  - escolha aleatória

### Invisível
- Jogador escolhe apenas o número.
- Par/Ímpar é sorteado após as escolhas.

### Caos
- Intervalo permitido muda a cada rodada automaticamente.
- As faixas são sorteadas de forma imprevisível (ex.: 0–3, 4–8, 0–20, 2–6).

### Sobrevivência
- Fila contínua.
- Quem perde sai.
- Último sobrevivente vence.

## IA para fallback de matchmaking

Quando não houver jogadores disponíveis em modos sem premiação financeira (ver seção **Economia e premiações**):

- IA Aleatória
- IA Teimosa
- IA Psicológica
- IA Caótica

## Estatísticas de jogador

- vitórias e derrotas
- taxa de vitória
- partidas jogadas
- sequência atual e maior sequência
- número favorito e menos usado
- percentual de uso por número
- percentual de Par e Ímpar
- tempo médio por jogada
- torneios vencidos

## Perfil e ranking

Perfil do jogador:
- avatar
- nome
- país
- ranking
- estatísticas
- histórico recente

Ranking:
- Sistema Elo
- Ligas: Bronze, Prata, Ouro, Platina, Diamante, Mestre, Lendário
- Progressão por faixas de Elo configuráveis (exemplo inicial: Bronze 0–999, Prata 1000–1199, Ouro 1200–1399, Platina 1400–1599, Diamante 1600–1799, Mestre 1800–1999, Lendário 2000+)
- Temporadas com reset parcial de ranking

## Sistema social

- lista de amigos
- convites
- histórico de partidas
- replays simples
- compartilhamento de perfil

## Economia e premiações

### Futuro: apostas em dinheiro
- Exemplo: R$10 + R$10, taxa da plataforma e prêmio ao vencedor.
- Implementação condicionada à validação jurídica/regulatória.

### Alternativa inicial
- Moedas virtuais para:
  - entrada em campeonatos
  - cosméticos
  - avatares
  - efeitos especiais
  - molduras
  - títulos

## Recompensas e conquistas

Exemplos:
- 100 vitórias
- 10 torneios vencidos
- sequência de 20 vitórias
- nunca repetir número
- vencer só com números pares
- derrotar IA Psicológica
- vencer torneio sem perder rodada

## Interface

### Tela inicial
- Jogar Agora
- Torneios
- Ranking
- Perfil
- Amigos

### Durante a partida
- escolha do número
- escolha Par/Ímpar
- cronômetro
- histórico de rodadas
- estatísticas do adversário (modo difícil)

### Final da partida
- vitória/derrota
- estatísticas da partida
- rematch
- compartilhamento de resultado

## Marketing

Slogans possíveis:
- "O campeonato de Par ou Ímpar online finalmente existe."
- "Agora aquela desculpa virou realidade."
- "Não posso sair hoje. Tenho campeonato de Par ou Ímpar."

## Roadmap

### MVP
- cadastro/login
- partida rápida
- melhor de 3
- intervalo 0–10
- ranking Elo
- estatísticas básicas
- IA Aleatória
- salas privadas

### Versão 2
- torneios automáticos
- modo difícil
- amigos
- histórico de partidas
- perfil completo
- demais IAs

### Versão 3
- modos Relâmpago, Invisível, Caos e Sobrevivência
- temporadas
- conquistas
- cosméticos
- replays

### Versão 4
- economia virtual madura
- campeonatos patrocinados
- streaming de finais
- premiações em dinheiro (se viável juridicamente)

## Diferencial

Transformar uma brincadeira simples em uma experiência online rápida, social, nostálgica e competitiva, com partidas curtas e alto potencial de compartilhamento.
