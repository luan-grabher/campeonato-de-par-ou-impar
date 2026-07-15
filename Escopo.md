# Escopo do Projeto – Campeonato de Par ou Ímpar Online

## Conceito

Criar uma plataforma online competitiva de **Par ou Ímpar**, acessível diretamente pelo navegador (desktop e mobile), transformando um antigo meme da internet ("não posso, tenho campeonato de par ou ímpar online") em um jogo real.

O objetivo é oferecer partidas extremamente rápidas, competitivas e sociais, com ranking, campeonatos, estatísticas, IA, modos alternativos e, futuramente, um sistema opcional de premiações.

---

# Objetivos

- Partidas que durem menos de 1 minuto.
- Qualquer pessoa entender como jogar em menos de 10 segundos.
- Interface extremamente simples.
- Foco em partidas rápidas e "só mais uma".
- Competitividade baseada em leitura de padrões do adversário.
- Transformar um meme antigo em um produto divertido e compartilhável.

---

# Plataforma

- Navegador (Web)
- Desktop
- Mobile
- Sem necessidade de instalar aplicativo.

---

# Sistema de Partidas

## Partida Rápida

Encontrar um adversário automaticamente.

Formato:

- Melhor de 3.

---

## Partida Personalizada

Criar uma sala privada.

Permitir enviar link para amigos.

Configurações:

- Melhor de 3
- Melhor de 5
- Melhor de 7
- Escolha do modo de jogo

---

## Campeonatos

Formato mata-mata.

Exemplo:

- 8 jogadores
- 16 jogadores
- 32 jogadores
- 64 jogadores

Estrutura:

- Oitavas
- Quartas
- Semifinal
- Final

Regras:

- Todas as partidas melhor de 3.
- Final melhor de 5.

Pode haver campeonatos automáticos em horários específicos.

---

# Modos de jogo

## Modo Clássico

Cada jogador:

- escolhe Par ou Ímpar
- escolhe um número

Após ambos confirmarem:

- revela simultaneamente
- soma dos números
- verifica paridade
- vencedor da rodada

---

## Intervalos de números

O sistema deve permitir diversos conjuntos.

Exemplo:

Modo tradicional

- 1 e 2

Modo expandido

- 0 até 10

No futuro:

- 0 até 20
- Intervalos personalizados

---

## Modo Difícil

Mostrar estatísticas completas do adversário durante a partida.

Exemplo:

```
0 → 6%
1 → 10%
2 → 24%
3 → 8%
4 → 15%
5 → 3%
...
```

Também mostrar:

- número mais utilizado
- frequência de pares
- frequência de ímpares
- sequência atual
- taxa de repetição

Objetivo:

Transformar um jogo puramente aleatório em um jogo de leitura de comportamento.

---

## Modo Relâmpago

Tempo extremamente curto.

Exemplo:

- 3 segundos
- 5 segundos

Caso não escolha:

- derrota automática
    
    ou
    
- escolha aleatória

---

## Modo Invisível

O jogador escolhe o número normalmente.

Porém:

Não escolhe Par ou Ímpar.

Após ambos escolherem os números, o sistema sorteia quem ficará com Par e quem ficará com Ímpar.

Isso muda completamente a forma de pensar.

---

## Modo Caos

A cada rodada muda automaticamente o intervalo permitido.

Exemplo:

Rodada 1

0–3

Rodada 2

4–8

Rodada 3

0–20

Rodada 4

2–6

Nunca é igual.

---

## Modo Sobrevivência

Todos entram em uma fila.

Quem perde é eliminado.

Quem vence continua.

Último sobrevivente vence.

---

# IA

Caso não existam jogadores disponíveis.

Não participa de partidas valendo dinheiro.

Personalidades:

## IA Aleatória

Escolhe totalmente ao acaso.

---

## IA Teimosa

Repete sempre os mesmos números.

---

## IA Psicológica

Aprende padrões do jogador durante a partida.

---

## IA Caótica

Começa previsível.

Depois muda completamente.

---

# Estatísticas

Cada jogador terá:

Vitórias

Derrotas

Taxa de vitória

Partidas jogadas

Sequência atual

Maior sequência

Número favorito

Número menos usado

Percentual de uso de cada número

Percentual de Par

Percentual de Ímpar

Tempo médio por jogada

Quantidade de campeonatos vencidos

---

# Perfil

Cada jogador possui:

- Avatar
- Nome
- País
- Ranking
- Estatísticas
- Histórico recente

---

# Ranking

Sistema Elo.

Possíveis ligas:

- Bronze
- Prata
- Ouro
- Platina
- Diamante
- Mestre
- Lendário

Temporadas podem reiniciar parcialmente o ranking.

---

# Sistema Social

Lista de amigos.

Convites.

Histórico de partidas.

Replays simples.

Compartilhamento do perfil.

---

# Sistema de Apostas (Futuro)

Funcionamento básico:

Cada jogador deposita:

R$10

Total:

R$20

A plataforma retém uma taxa.

Exemplo:

Taxa:

R$2

Vencedor recebe:

R$18

Também permitir outros valores.

Observação:

Antes da implementação será necessário validar toda a parte jurídica e regulatória.

---

# Economia Alternativa

Caso apostas não sejam implementadas inicialmente.

Sistema de moedas virtuais.

Possibilidades:

- entrada em campeonatos
- compra de cosméticos
- desbloqueio de avatares
- efeitos especiais
- molduras
- títulos

---

# Recompensas

Conquistas.

Exemplos:

- 100 vitórias
- 10 campeonatos
- sequência de 20 vitórias
- nunca escolher o mesmo número duas vezes
- ganhar usando apenas números pares
- derrotar IA Psicológica
- vencer um campeonato sem perder nenhuma rodada

---

# Interface

Tela inicial

- Jogar Agora
- Campeonatos
- Ranking
- Perfil
- Amigos

Durante a partida:

- Escolha do número
- Escolha Par/Ímpar
- Cronômetro
- Histórico das rodadas
- Estatísticas do adversário (Modo Difícil)

Final:

- Vitória/Derrota
- Estatísticas da partida
- Rematch
- Compartilhar resultado

---

# Marketing

Grande diferencial:

Transformar em realidade um meme extremamente conhecido da internet brasileira.

Possíveis slogans:

- "O campeonato de Par ou Ímpar online finalmente existe."
- "Agora aquela desculpa virou realidade."
- "Não posso sair hoje. Tenho campeonato de Par ou Ímpar."

Esse aspecto pode gerar divulgação orgânica nas redes sociais, já que muitas pessoas conhecem a piada e terão curiosidade em descobrir que ela realmente virou um jogo.

---

# Roadmap

## MVP

- Cadastro/Login
- Partida rápida
- Melhor de 3
- Intervalo 0–10
- Ranking Elo
- Estatísticas básicas
- IA Aleatória
- Salas privadas

## Versão 2

- Campeonatos automáticos
- Modo Difícil
- Amigos
- Histórico de partidas
- Perfil completo
- Demais IAs

## Versão 3

- Modos Relâmpago, Invisível, Caos e Sobrevivência
- Temporadas
- Conquistas
- Cosméticos
- Replays

## Versão 4

- Economia virtual
- Campeonatos patrocinados
- Streaming de finais
- Sistema de premiações em dinheiro (caso a viabilidade jurídica seja confirmada)

## Diferencial do projeto

O jogo não pretende competir pela complexidade de suas regras, mas pela combinação de simplicidade, partidas extremamente rápidas, humor, nostalgia e competitividade. A proposta é transformar uma brincadeira conhecida em uma experiência online real, acessível em segundos, fácil de compartilhar e potencialmente viciante pelo ciclo curto de partidas e evolução no ranking.