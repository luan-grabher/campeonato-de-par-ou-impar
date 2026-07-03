import Link from 'next/link';
import { privateRoomFeatures } from '../../../lib/site-content';

export default function PrivateRoomsPage() {
  return (
    <section className="section">
      <div className="stack">
        <span className="badge primary">Salas privadas</span>
        <h1>Convide amigos por link</h1>
        <p className="muted">
          Espaço inicial para criação de lobbies privados com regras ajustáveis antes da partida começar.
        </p>
      </div>

      <div className="grid" style={{ marginTop: 24 }}>
        {privateRoomFeatures.map((feature) => (
          <article className="card" key={feature}>
            <p>{feature}</p>
          </article>
        ))}
      </div>

      <article className="panel" style={{ marginTop: 24 }}>
        <h3>Exemplo de sala</h3>
        <p className="muted">https://campeonato-de-par-ou-impar.app/sala/ABC123</p>
        <p>
          Nesta estrutura inicial, a sala já está preparada para suportar melhor de 3, melhor de 5, melhor de 7 e escolha do modo de jogo.
        </p>
      </article>

      <div className="actions" style={{ marginTop: 24 }}>
        <Link className="button primary" href="/mvp">
          Voltar ao MVP
        </Link>
        <Link className="button" href="/mvp/partida-rapida">
          Partida rápida
        </Link>
      </div>
    </section>
  );
}
