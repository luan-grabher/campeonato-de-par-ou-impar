import Link from 'next/link';
import { quickMatchSteps } from '../../../lib/site-content';

export default function QuickMatchPage() {
  return (
    <section className="section">
      <div className="stack">
        <span className="badge primary">Partida rápida</span>
        <h1>Fila automática para melhor de 3</h1>
        <p className="muted">
          Fluxo inicial para o modo principal do jogo, pronto para ser conectado ao matchmaking real.
        </p>
      </div>

      <div className="two-col" style={{ marginTop: 24 }}>
        <article className="panel">
          <h3>Fluxo da partida</h3>
          <ol className="list">
            {quickMatchSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="panel">
          <h3>Regras do MVP</h3>
          <ul className="list">
            <li>Intervalo de números: 0 a 10.</li>
            <li>Rodadas melhor de 3.</li>
            <li>Fallback com IA Aleatória quando não houver jogadores.</li>
            <li>Sem WebSocket e sem SSE.</li>
          </ul>
        </article>
      </div>

      <div className="actions" style={{ marginTop: 24 }}>
        <Link className="button primary" href="/mvp">
          Voltar ao MVP
        </Link>
        <Link className="button" href="/login">
          Autenticação
        </Link>
      </div>
    </section>
  );
}
