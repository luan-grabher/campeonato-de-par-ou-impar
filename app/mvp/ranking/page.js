'use client';

import Link from 'next/link';
import { rankingTiers } from '../../../lib/site-content';
import { getCurrentUser, getCurrentUserStats, getLeaderboard, useMvpState } from '../../../lib/mvp-store';

export default function RankingPage() {
  const state = useMvpState();
  const leaderboard = getLeaderboard(state);
  const currentUser = getCurrentUser(state);
  const stats = getCurrentUserStats(state);

  return (
    <section className="section">
      <div className="stack">
        <span className="badge primary">Ranking Elo</span>
        <h1>Progressão competitiva completa</h1>
        <p className="muted">
          Cada partida atualiza o perfil do jogador, a posição no ranking e a sequência atual.
        </p>
      </div>

      <div className="two-col" style={{ marginTop: 24 }}>
        <article className="panel">
          <h3>Seu perfil</h3>
          {currentUser ? (
            <div className="grid">
              <div className="card">
                <h3>{stats.elo}</h3>
                <p>Elo</p>
              </div>
              <div className="card">
                <h3>{stats.wins}</h3>
                <p>Vitórias</p>
              </div>
              <div className="card">
                <h3>{stats.losses}</h3>
                <p>Derrotas</p>
              </div>
              <div className="card">
                <h3>{stats.winRate}%</h3>
                <p>Taxa de vitória</p>
              </div>
            </div>
          ) : (
            <p className="muted">Entre no app para salvar seu ranking.</p>
          )}
        </article>

        <article className="panel">
          <h3>Faixas de Elo</h3>
          <div className="stack">
            {rankingTiers.map(([tier, range]) => (
              <div key={tier} className="meta">
                <span className="badge">{tier}</span>
                <span className="muted">{range} Elo</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="panel" style={{ marginTop: 24 }}>
        <h3>Leaderboard</h3>
        {leaderboard.length === 0 ? (
          <p className="muted">Nenhum jogador registrado ainda.</p>
        ) : (
          <div className="grid">
            {leaderboard.slice(0, 8).map((player, index) => (
              <div className="card" key={player.id}>
                <div className="meta">
                  <span className="badge">#{index + 1}</span>
                  <span className="badge">{player.elo} Elo</span>
                </div>
                <h3>{player.name}</h3>
                <p>
                  {player.wins} vitórias · {player.losses} derrotas · sequência {player.streak}
                </p>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="panel" style={{ marginTop: 24 }}>
        <h3>O que é rastreado</h3>
        <ul className="list">
          <li>Vitórias, derrotas e taxa de vitória.</li>
          <li>Elo com atualização após cada partida.</li>
          <li>Sequência atual, melhor sequência e número favorito.</li>
          <li>Histórico recente de partidas.</li>
        </ul>
      </article>

      <div className="actions" style={{ marginTop: 24 }}>
        <Link className="button primary" href="/mvp">
          Voltar ao MVP
        </Link>
        <Link className="button" href="/login">
          Login
        </Link>
      </div>
    </section>
  );
}
