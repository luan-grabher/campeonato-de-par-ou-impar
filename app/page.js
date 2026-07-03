import Link from 'next/link';
import { mvpCards, quickMatchSteps, rankingTiers } from '../lib/site-content';

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-grid">
          <div className="stack">
            <span className="badge primary">MVP jogável</span>
            <h1>O campeonato de Par ou Ímpar online já tem fluxo completo no navegador.</h1>
            <p className="muted">
              Cadastro, partidas rápidas, salas privadas e ranking Elo já estão conectados ao mesmo fluxo.
            </p>
            <div className="actions">
              <Link className="button primary" href="/mvp">
                Ver MVP
              </Link>
              <Link className="button" href="/mvp/partida-rapida">
                Partida rápida
              </Link>
              <Link className="button" href="/mvp/ranking">
                Ranking
              </Link>
            </div>
          </div>
          <div className="panel">
            <h3>Fluxo da partida rápida</h3>
            <ol className="list">
              {quickMatchSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Base do produto</h2>
        <div className="grid">
          {mvpCards.map((card) => (
            <article className="card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section two-col">
        <article className="panel">
          <h2>Ranking inicial</h2>
          <div className="stack">
            {rankingTiers.map(([tier, range]) => (
              <div key={tier} className="meta">
                <span className="badge">{tier}</span>
                <span className="muted">{range} Elo</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Stack e restrições</h2>
          <div className="stack">
            <p>Next.js + React + Supabase Auth.</p>
            <p>Sem WebSocket. Sem SSE.</p>
            <p>Interface mobile-first para partidas rápidas.</p>
          </div>
        </article>
      </section>
    </>
  );
}
