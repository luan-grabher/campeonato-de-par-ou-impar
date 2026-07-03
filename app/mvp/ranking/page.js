import Link from 'next/link';
import { rankingTiers } from '../../../lib/site-content';

export default function RankingPage() {
  return (
    <section className="section">
      <div className="stack">
        <span className="badge primary">Ranking Elo</span>
        <h1>Progressão competitiva inicial</h1>
        <p className="muted">
          Base para ligas, temporadas e evolução dos jogadores no futuro.
        </p>
      </div>

      <div className="grid" style={{ marginTop: 24 }}>
        {rankingTiers.map(([tier, range]) => (
          <article className="card" key={tier}>
            <h3>{tier}</h3>
            <p>{range} Elo</p>
          </article>
        ))}
      </div>

      <article className="panel" style={{ marginTop: 24 }}>
        <h3>Estatísticas básicas do perfil</h3>
        <ul className="list">
          <li>Vitórias, derrotas e taxa de vitória.</li>
          <li>Partidas jogadas e sequência atual.</li>
          <li>Número favorito e menos usado.</li>
          <li>Tempo médio por jogada.</li>
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
