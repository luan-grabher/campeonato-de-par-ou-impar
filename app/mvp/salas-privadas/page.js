'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createRoom, getCurrentUser, joinRoom, leaveRoom, useMvpState } from '../../../lib/mvp-store';

export default function PrivateRoomsPage() {
  const state = useMvpState();
  const currentUser = getCurrentUser(state);
  const [title, setTitle] = useState('Sala dos amigos');
  const [bestOf, setBestOf] = useState(3);
  const [mode, setMode] = useState('casual');
  const [joinCode, setJoinCode] = useState('');
  const [pendingInviteCode, setPendingInviteCode] = useState('');
  const [feedback, setFeedback] = useState('Crie uma sala ou entre por código.');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const roomFromLink = (params.get('room') || '').trim().toUpperCase();

    if (roomFromLink) {
      setJoinCode(roomFromLink);
      setPendingInviteCode(roomFromLink);
      setFeedback(`Link aberto para a sala ${roomFromLink}.`);
    }
  }, []);

  useEffect(() => {
    if (!pendingInviteCode || !currentUser) {
      return;
    }

    joinRoom(pendingInviteCode);
    setPendingInviteCode('');
  }, [currentUser?.id, pendingInviteCode]);

  const myRooms = useMemo(
    () => state.rooms.filter((room) => room.hostId === currentUser?.id || room.opponentId === currentUser?.id),
    [currentUser?.id, state.rooms]
  );

  async function copyRoomLink(code) {
    const link = `${window.location.origin}/mvp/salas-privadas?room=${code}`;
    await navigator.clipboard.writeText(link);
    setFeedback(`Link da sala ${code} copiado.`);
  }

  function handleCreateRoom(event) {
    event.preventDefault();

    if (!currentUser) {
      setFeedback('Entre no app antes de criar uma sala.');
      return;
    }

    const nextState = createRoom({
      title,
      bestOf: Number(bestOf),
      mode,
    });
    const room = nextState.rooms[0];

    setJoinCode(room.code);
    setFeedback(`Sala ${room.code} criada com sucesso.`);
  }

  function handleJoinRoom(event) {
    event.preventDefault();

    if (!currentUser) {
      setFeedback('Entre no app antes de entrar em uma sala.');
      return;
    }

    joinRoom(joinCode);
    setFeedback(`Tentativa de entrada enviada para ${joinCode.toUpperCase() || '—'}.`);
  }

  function handleLeaveRoom(code) {
    leaveRoom(code);
    setFeedback(`Você saiu da sala ${code}.`);
  }

  return (
    <section className="section">
      <div className="stack">
        <span className="badge primary">Salas privadas</span>
        <h1>Lobbies prontos para amigos</h1>
        <p className="muted">
          Crie, compartilhe e entre em salas com código curto. O estado fica sincronizado entre abas do navegador.
        </p>
      </div>

      <div className="two-col" style={{ marginTop: 24 }}>
        <article className="panel">
          <h3>Criar sala</h3>
          <form className="form" onSubmit={handleCreateRoom}>
            <label className="stack">
              <span>Título</span>
              <input className="input" onChange={(event) => setTitle(event.target.value)} value={title} />
            </label>
            <label className="stack">
              <span>Melhor de</span>
              <select className="input" onChange={(event) => setBestOf(event.target.value)} value={String(bestOf)}>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={7}>7</option>
              </select>
            </label>
            <label className="stack">
              <span>Modo</span>
              <select className="input" onChange={(event) => setMode(event.target.value)} value={mode}>
                <option value="casual">Casual</option>
                <option value="competitivo">Competitivo</option>
                <option value="treino">Treino</option>
              </select>
            </label>
            <button className="button primary" type="submit">
              Criar sala
            </button>
          </form>
        </article>

        <article className="panel">
          <h3>Entrar por código</h3>
          <form className="form" onSubmit={handleJoinRoom}>
            <label className="stack">
              <span>Código da sala</span>
              <input className="input" onChange={(event) => setJoinCode(event.target.value)} placeholder="ABC123" value={joinCode} />
            </label>
            <button className="button primary" type="submit">
              Entrar na sala
            </button>
          </form>
          <div className="result-banner" style={{ marginTop: 20 }}>
            <strong>Feedback</strong>
            <p>{feedback}</p>
          </div>
        </article>
      </div>

      <div className="grid" style={{ marginTop: 24 }}>
        {myRooms.length === 0 ? (
          <article className="card">
            <h3>Suas salas</h3>
            <p className="muted">Você ainda não participou de nenhuma sala.</p>
          </article>
        ) : (
          myRooms.map((room) => (
            <article className="card" key={room.id}>
              <div className="stack">
                <div className="meta">
                  <span className="badge">{room.code}</span>
                  <span className="badge">{room.status}</span>
                  <span className="badge">{room.bestOf} rodadas</span>
                </div>
                <h3>{room.title}</h3>
                <p>
                  Host: {room.hostName}
                  <br />
                  Oponente: {room.opponentName || 'Aguardando'}
                </p>
                <p className="muted">{room.lastMessage}</p>
                <div className="actions">
                  <button className="button" onClick={() => copyRoomLink(room.code)} type="button">
                    Copiar link
                  </button>
                  <button className="button" onClick={() => handleLeaveRoom(room.code)} type="button">
                    Sair
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <article className="panel" style={{ marginTop: 24 }}>
        <h3>Fluxo concluído</h3>
        <ul className="list">
          <li>Criação de sala com link compartilhável.</li>
          <li>Entrada por código e sincronização entre abas.</li>
          <li>Base pronta para evoluir a disputa dentro do lobby.</li>
        </ul>
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
