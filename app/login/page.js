'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { createSupabaseClient } from '../../lib/supabase';
import { createLocalEmail, getCurrentUser, getCurrentUserStats, signInLocal, signOutLocal, useMvpState } from '../../lib/mvp-store';

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const state = useMvpState();
  const currentUser = getCurrentUser(state);
  const stats = getCurrentUserStats(state);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState(currentUser ? 'Sessão carregada neste navegador.' : 'Crie seu perfil para começar.');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setFeedback('Informe um e-mail para continuar.');
      return;
    }

    setLoading(true);

    try {
      if (supabase && password) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (!error && data?.user) {
          signInLocal({
            name: trimmedName || data.user.user_metadata?.name || trimmedEmail.split('@')[0],
            email: data.user.email || trimmedEmail,
          });
          setFeedback('Login autenticado via Supabase e perfil salvo no navegador.');
          return;
        }

        setFeedback(error ? `Falha no Supabase: ${error.message}. Entrando no modo local.` : 'Supabase indisponível. Entrando no modo local.');
      }

      signInLocal({
        name: trimmedName || trimmedEmail.split('@')[0],
        email: trimmedEmail || createLocalEmail(trimmedName || trimmedEmail),
      });
      setFeedback('Perfil salvo localmente e pronto para jogar.');
    } catch {
      signInLocal({
        name: trimmedName || trimmedEmail.split('@')[0],
        email: trimmedEmail || createLocalEmail(trimmedName || trimmedEmail),
      });
      setFeedback('Autenticação local concluída.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setLoading(true);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } finally {
      signOutLocal();
      setFeedback('Sessão encerrada.');
      setLoading(false);
    }
  }

  return (
    <section className="section two-col">
      <article className="panel">
        <span className="badge primary">Acesso do jogador</span>
        <h1>Entrar na plataforma</h1>
        <p className="muted">
          O app já funciona com sessão persistida no navegador e, quando configurado, também tenta autenticar no Supabase.
        </p>
        <form className="form" onSubmit={handleSubmit}>
          <label className="stack">
            <span>Nome</span>
            <input className="input" maxLength={24} onChange={(event) => setName(event.target.value)} value={name} placeholder="Jogador 1" />
          </label>
          <label className="stack">
            <span>E-mail</span>
            <input className="input" onChange={(event) => setEmail(event.target.value)} type="email" value={email} placeholder="voce@exemplo.com" />
          </label>
          <label className="stack">
            <span>Senha opcional</span>
            <input className="input" onChange={(event) => setPassword(event.target.value)} type="password" value={password} placeholder="••••••••" />
          </label>
          <button className="button primary" disabled={loading} type="submit">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="result-banner" style={{ marginTop: 20 }}>
          <strong>Status</strong>
          <p>{feedback}</p>
        </div>
      </article>

      <article className="panel">
        <h3>Perfil atual</h3>
        {currentUser ? (
          <div className="stack">
            <p>
              <strong>{currentUser.name}</strong>
              <br />
              <span className="muted">{currentUser.email || 'Sem e-mail cadastrado'}</span>
            </p>
            <div className="grid">
              <div className="card">
                <h3>{stats.elo}</h3>
                <p>Elo</p>
              </div>
              <div className="card">
                <h3>{stats.winRate}%</h3>
                <p>Taxa de vitória</p>
              </div>
              <div className="card">
                <h3>{stats.matchesPlayed}</h3>
                <p>Partidas</p>
              </div>
              <div className="card">
                <h3>{stats.favoriteNumber ?? '—'}</h3>
                <p>Número favorito</p>
              </div>
            </div>
            <button className="button" disabled={loading} onClick={handleSignOut} type="button">
              Sair
            </button>
          </div>
        ) : (
          <p className="muted">Nenhuma sessão ativa. Entre para salvar partidas, salas e ranking.</p>
        )}

        <div style={{ marginTop: 24 }}>
          <h3>Fluxo concluído</h3>
          <ul className="list">
            <li>Entrada com perfil persistido no navegador.</li>
            <li>Suporte opcional a Supabase Auth quando configurado.</li>
            <li>Base pronta para partidas, salas e ranking.</li>
          </ul>
        </div>

        <div className="actions" style={{ marginTop: 24 }}>
          <Link className="button primary" href="/mvp">
            Ver MVP
          </Link>
          <Link className="button" href="/mvp/partida-rapida">
            Jogar agora
          </Link>
        </div>
      </article>
    </section>
  );
}
