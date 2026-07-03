import Link from 'next/link';

export default function LoginPage() {
  return (
    <section className="section two-col">
      <article className="panel">
        <span className="badge primary">Supabase Auth</span>
        <h1>Entrar na plataforma</h1>
        <p className="muted">
          Estrutura inicial para autenticação com Supabase. O formulário ainda não está ligado a credenciais reais.
        </p>
        <form className="form">
          <label className="stack">
            <span>E-mail</span>
            <input className="input" type="email" placeholder="voce@exemplo.com" />
          </label>
          <label className="stack">
            <span>Senha</span>
            <input className="input" type="password" placeholder="••••••••" />
          </label>
          <button className="button primary" type="button">
            Entrar
          </button>
        </form>
      </article>

      <article className="panel">
        <h3>Configuração necessária</h3>
        <ul className="list">
          <li>Definir NEXT_PUBLIC_SUPABASE_URL.</li>
          <li>Definir NEXT_PUBLIC_SUPABASE_ANON_KEY.</li>
          <li>Conectar o client em lib/supabase.js.</li>
          <li>Adicionar fluxo real de sign-in no próximo passo.</li>
        </ul>
        <div className="actions" style={{ marginTop: 24 }}>
          <Link className="button primary" href="/mvp">
            Ver MVP
          </Link>
          <Link className="button" href="/">
            Início
          </Link>
        </div>
      </article>
    </section>
  );
}
