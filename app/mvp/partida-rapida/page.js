import Link from 'next/link';
import QuickMatchGame from './quick-match-game';

export default function QuickMatchPage() {
  return (
    <section className="section">
      <div className="stack">
        <span className="badge primary">Partida rápida</span>
        <h1>Fluxo jogável do MVP</h1>
        <p className="muted">Aqui a partida já roda do começo ao fim, com escolha de número, Par/Ímpar e placar da melhor de 3.</p>
      </div>

      <div style={{ marginTop: 24 }}>
        <QuickMatchGame />
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
