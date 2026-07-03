'use client';

import { useMemo, useState } from 'react';

const MAX_NUMBER = 10;
const INITIAL_SELECTION = {
  number: '5',
  parity: 'par',
};

function parityLabel(value) {
  return value === 'par' ? 'Par' : 'Ímpar';
}

function parityFromTotal(total) {
  return total % 2 === 0 ? 'par' : 'impar';
}

function randomNumber() {
  return Math.floor(Math.random() * (MAX_NUMBER + 1));
}

export default function QuickMatchGame() {
  const [playerName, setPlayerName] = useState('Jogador');
  const [phase, setPhase] = useState('idle');
  const [round, setRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [history, setHistory] = useState([]);
  const [selection, setSelection] = useState(INITIAL_SELECTION);
  const [winner, setWinner] = useState('');
  const [feedback, setFeedback] = useState('Configure o jogador e inicie a partida.');

  const opponentName = 'IA Aleatória';

  const isPlaying = phase === 'playing';
  const statusLabel = useMemo(() => {
    if (phase === 'finished') {
      return winner === playerName ? 'Você venceu a melhor de 3' : `${opponentName} venceu a melhor de 3`;
    }

    if (phase === 'playing') {
      return `Rodada ${round} de 3`;
    }

    return 'Pronto para começar';
  }, [opponentName, phase, playerName, round, winner]);

  function resetMatch(startPhase = 'idle') {
    setPhase(startPhase);
    setRound(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setHistory([]);
    setWinner('');
    setFeedback('Configure o jogador e inicie a partida.');
    setSelection(INITIAL_SELECTION);
  }

  function startMatch() {
    const normalizedName = playerName.trim() || 'Jogador';
    setPlayerName(normalizedName);
    setPhase('playing');
    setRound(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setHistory([]);
    setWinner('');
    setFeedback(`${normalizedName} entrou na fila e encontrou ${opponentName}.`);
    setSelection((current) => ({
      ...current,
      number: current.number || INITIAL_SELECTION.number,
    }));
  }

  function playRound(event) {
    event.preventDefault();

    if (!isPlaying) {
      return;
    }

    const playerNumber = Number(selection.number);

    if (Number.isNaN(playerNumber) || playerNumber < 0 || playerNumber > MAX_NUMBER) {
      setFeedback('Escolha um número entre 0 e 10.');
      return;
    }

    const opponentNumber = randomNumber();
    const total = playerNumber + opponentNumber;
    const actualParity = parityFromTotal(total);
    const didWin = selection.parity === actualParity;
    const playerTotal = playerScore + (didWin ? 1 : 0);
    const opponentTotal = opponentScore + (didWin ? 0 : 1);
    const roundWinner = didWin ? playerName : opponentName;
    const roundSummary = {
      round,
      playerNumber,
      opponentNumber,
      total,
      actualParity,
      selectedParity: selection.parity,
      winner: roundWinner,
    };
    const nextRound = round + 1;
    const matchFinished = playerTotal === 2 || opponentTotal === 2 || round === 3;

    setHistory((current) => [...current, roundSummary]);
    setPlayerScore(playerTotal);
    setOpponentScore(opponentTotal);
    setFeedback(
      `Rodada ${round}: você jogou ${playerNumber}, ${opponentName} jogou ${opponentNumber}. Total ${total} (${parityLabel(actualParity)}). ${roundWinner} venceu.`
    );

    if (matchFinished) {
      setPhase('finished');
      setWinner(didWin ? playerName : opponentName);
      return;
    }

    setRound(nextRound);
    setSelection((current) => ({
      ...current,
      number: String((playerNumber + 1) % (MAX_NUMBER + 1)),
    }));
  }

  return (
    <section className="two-col">
      <article className="panel game-shell">
        <div className="stack">
          <span className="badge primary">Fluxo real do MVP</span>
          <h2>Partida rápida em melhor de 3</h2>
          <p className="muted">
            Escolha seu número, feche a aposta de Par ou Ímpar e jogue a sequência completa sem WebSocket ou SSE.
          </p>
        </div>

        <div className="status-line">
          <span className="badge">{statusLabel}</span>
          <span className="badge">{playerName}</span>
          <span className="badge">{opponentName}</span>
        </div>

        <div className="scoreboard">
          <div className="scorecard">
            <small>Você</small>
            <strong>{playerScore}</strong>
          </div>
          <div className="scorecard">
            <small>Rodada</small>
            <strong>{phase === 'idle' ? '—' : round}</strong>
          </div>
          <div className="scorecard">
            <small>IA</small>
            <strong>{opponentScore}</strong>
          </div>
        </div>

        {phase === 'idle' ? (
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              startMatch();
            }}
          >
            <label className="stack">
              <span>Seu nome</span>
              <input
                className="input"
                maxLength={24}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Jogador 1"
                value={playerName}
              />
            </label>
            <button className="button primary" type="submit">
              Encontrar oponente
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={playRound}>
            <label className="stack">
              <span>Número escolhido</span>
              <input
                className="input"
                max={MAX_NUMBER}
                min="0"
                onChange={(event) => setSelection((current) => ({ ...current, number: event.target.value }))}
                type="number"
                value={selection.number}
              />
            </label>

            <div className="stack">
              <span>Escolha sua aposta</span>
              <div className="choice-row" role="group" aria-label="Escolha entre par ou ímpar">
                <button
                  className={`choice-button ${selection.parity === 'par' ? 'active' : ''}`}
                  onClick={() => setSelection((current) => ({ ...current, parity: 'par' }))}
                  type="button"
                >
                  Par
                </button>
                <button
                  className={`choice-button ${selection.parity === 'impar' ? 'active' : ''}`}
                  onClick={() => setSelection((current) => ({ ...current, parity: 'impar' }))}
                  type="button"
                >
                  Ímpar
                </button>
              </div>
            </div>

            <button className="button primary" type="submit">
              Resolver rodada
            </button>
          </form>
        )}

        <div className="result-banner" aria-live="polite">
          <strong>Resumo</strong>
          <p>{feedback}</p>
        </div>

        {phase === 'finished' ? (
          <div className="actions">
            <button className="button primary" onClick={() => resetMatch()} type="button">
              Jogar novamente
            </button>
          </div>
        ) : null}
      </article>

      <article className="panel timeline">
        <div className="stack">
          <h3>Regras do jogo</h3>
          <ul className="list">
            <li>Os números vão de 0 a 10.</li>
            <li>Quem acertar a paridade vence a rodada.</li>
            <li>O primeiro a fazer 2 pontos vence a melhor de 3.</li>
            <li>Sem multiplayer em tempo real: a IA fecha o ciclo do MVP.</li>
          </ul>
        </div>

        <div className="stack">
          <h3>Histórico das rodadas</h3>
          {history.length === 0 ? (
            <p className="muted">Nenhuma rodada jogada ainda.</p>
          ) : (
            history.map((item) => (
              <div className="timeline-item" key={item.round}>
                <strong>Rodada {item.round}</strong>
                <p>
                  Você jogou {item.playerNumber} e a IA jogou {item.opponentNumber}. Total {item.total} ({parityLabel(item.actualParity)}).
                </p>
                <p className="muted">Vencedor: {item.winner}</p>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
