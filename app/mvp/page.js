import Link from 'next/link';
import { mvpCards } from '../../lib/site-content';

export default function MvpPage() {
  return (
    <section className="section">
      <div className="stack">
        <span className="badge primary">Escopo do MVP</span>
        <h1>Estrutura inicial do produto</h1>
        <p className="muted">
          O MVP concentra login, partida rápida, salas privadas, ranking Elo, estatísticas básicas e IA Aleatória.
        </p>
      </div>

      <div className="grid" style={{ marginTop: 24 }}>
        {mvpCards.map((card) => (
          <article className="card" key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </div>

      <div className="actions" style={{ marginTop: 24 }}>
        <Link className="button primary" href="/login">
          Ir para login
        </Link>
        <Link className="button" href="/mvp/ranking">
          Ver ranking
        </Link>
        <Link className="button" href="/mvp/salas-privadas">
          Salas privadas
        </Link>
      </div>
    </section>
  );
}
