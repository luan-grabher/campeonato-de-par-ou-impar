import { useMemo, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'campeonato-de-par-ou-impar:mvp-state';
const CHANGE_EVENT = 'campeonato-de-par-ou-impar:mvp-state-change';
const DEFAULT_ELO = 1200;
const AI_ELO = 1000;
const ELO_K_FACTOR = 24;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_OPPONENT = 'IA Aleatória';
const EMPTY_STATE = {
  currentUserId: null,
  users: [],
  rooms: [],
  matches: [],
};
let cachedRawState = null;
let cachedSnapshot = normalizeState(EMPTY_STATE);

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createLocalEmail(name) {
  const normalized = (name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
  return `${normalized || 'jogador'}@local`;
}

function clone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function normalizeUser(user) {
  return {
    id: user.id,
    name: user.name || 'Jogador',
    email: user.email || '',
    elo: Number.isFinite(user.elo) ? user.elo : DEFAULT_ELO,
    wins: Number.isFinite(user.wins) ? user.wins : 0,
    losses: Number.isFinite(user.losses) ? user.losses : 0,
    streak: Number.isFinite(user.streak) ? user.streak : 0,
    bestStreak: Number.isFinite(user.bestStreak) ? user.bestStreak : 0,
    matchesPlayed: Number.isFinite(user.matchesPlayed) ? user.matchesPlayed : 0,
    favoriteNumber: user.favoriteNumber ?? null,
    numberUsage: user.numberUsage && typeof user.numberUsage === 'object' ? user.numberUsage : {},
    lastMatchAt: user.lastMatchAt || null,
  };
}

function normalizeRoom(room) {
  return {
    id: room.id,
    code: room.code,
    title: room.title || `Sala ${room.code}`,
    hostId: room.hostId,
    hostName: room.hostName || 'Jogador',
    opponentId: room.opponentId || null,
    opponentName: room.opponentName || '',
    bestOf: [3, 5, 7].includes(room.bestOf) ? room.bestOf : 3,
    mode: room.mode || 'casual',
    status: room.status || 'waiting',
    createdAt: room.createdAt || nowIso(),
    updatedAt: room.updatedAt || nowIso(),
    lastMessage: room.lastMessage || 'Aguardando oponente.',
  };
}

function normalizeMatch(match) {
  return {
    id: match.id,
    type: match.type || 'quick',
    roomId: match.roomId || null,
    roomCode: match.roomCode || null,
    playerId: match.playerId,
    playerName: match.playerName || 'Jogador',
    opponentId: match.opponentId || null,
    opponentName: match.opponentName || DEFAULT_OPPONENT,
    result: match.result || 'loss',
    roundsPlayed: Number.isFinite(match.roundsPlayed) ? match.roundsPlayed : 0,
    playerNumber: Number.isFinite(match.playerNumber) ? match.playerNumber : null,
    opponentNumber: Number.isFinite(match.opponentNumber) ? match.opponentNumber : null,
    total: Number.isFinite(match.total) ? match.total : null,
    parity: match.parity || null,
    createdAt: match.createdAt || nowIso(),
  };
}

function normalizeState(state) {
  const source = state && typeof state === 'object' ? state : EMPTY_STATE;

  return {
    currentUserId: source.currentUserId || null,
    users: Array.isArray(source.users) ? source.users.map(normalizeUser) : [],
    rooms: Array.isArray(source.rooms) ? source.rooms.map(normalizeRoom) : [],
    matches: Array.isArray(source.matches) ? source.matches.map(normalizeMatch) : [],
  };
}

function readState() {
  if (typeof window === 'undefined') {
    return cachedSnapshot;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRawState) {
      return cachedSnapshot;
    }

    cachedRawState = raw;
    cachedSnapshot = raw ? normalizeState(JSON.parse(raw)) : normalizeState(EMPTY_STATE);
    return cachedSnapshot;
  } catch {
    cachedRawState = null;
    cachedSnapshot = normalizeState(EMPTY_STATE);
    return cachedSnapshot;
  }
}

function persistState(state) {
  if (typeof window === 'undefined') {
    return;
  }

  const serialized = JSON.stringify(state);
  cachedRawState = serialized;
  cachedSnapshot = state;
  window.localStorage.setItem(STORAGE_KEY, serialized);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function updateState(mutator) {
  const nextState = normalizeState(mutator(clone(readState())));
  persistState(nextState);
  return nextState;
}

function subscribe(listener) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, listener);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

export function useMvpState() {
  return useSyncExternalStore(subscribe, readState, readState);
}

export function getCurrentUser(state) {
  const normalized = normalizeState(state);
  return normalized.users.find((user) => user.id === normalized.currentUserId) || null;
}

export function getLeaderboard(state) {
  return normalizeState(state).users
    .slice()
    .sort((a, b) => b.elo - a.elo || b.wins - a.wins || a.name.localeCompare(b.name));
}

function pickFavoriteNumber(numberUsage, fallback) {
  const entries = Object.entries(numberUsage || {});
  if (entries.length === 0) {
    return fallback;
  }

  return entries.sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))[0][0];
}

function buildUpdatedUser(user, { won, playerNumber, opponentElo, createdAt }) {
  const numberUsage = { ...(user.numberUsage || {}) };

  if (Number.isFinite(playerNumber)) {
    numberUsage[playerNumber] = (numberUsage[playerNumber] || 0) + 1;
  }

  const previousElo = Number.isFinite(user.elo) ? user.elo : DEFAULT_ELO;
  const expectedScore = 1 / (1 + 10 ** ((opponentElo - previousElo) / 400));
  const score = won ? 1 : 0;
  const nextElo = Math.round(previousElo + ELO_K_FACTOR * (score - expectedScore));
  const nextStreak = won ? (user.streak || 0) + 1 : 0;

  return normalizeUser({
    ...user,
    elo: nextElo,
    wins: (user.wins || 0) + (won ? 1 : 0),
    losses: (user.losses || 0) + (won ? 0 : 1),
    streak: nextStreak,
    bestStreak: Math.max(user.bestStreak || 0, nextStreak),
    matchesPlayed: (user.matchesPlayed || 0) + 1,
    favoriteNumber: pickFavoriteNumber(numberUsage, user.favoriteNumber),
    numberUsage,
    lastMatchAt: createdAt,
  });
}

export function signInLocal({ name, email }) {
  return updateState((state) => {
    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();
    const fallbackName = trimmedEmail ? trimmedEmail.split('@')[0] : 'Jogador';
    const userName = trimmedName || fallbackName;
    const existingIndex = trimmedEmail
      ? state.users.findIndex((user) => user.email.toLowerCase() === trimmedEmail)
      : -1;
    const existingUser = existingIndex >= 0 ? state.users[existingIndex] : null;
    const user = normalizeUser({
      id: existingUser?.id || createId('user'),
      name: userName,
      email: trimmedEmail || existingUser?.email || '',
      elo: existingUser?.elo ?? DEFAULT_ELO,
      wins: existingUser?.wins ?? 0,
      losses: existingUser?.losses ?? 0,
      streak: existingUser?.streak ?? 0,
      bestStreak: existingUser?.bestStreak ?? 0,
      matchesPlayed: existingUser?.matchesPlayed ?? 0,
      favoriteNumber: existingUser?.favoriteNumber ?? null,
      numberUsage: existingUser?.numberUsage ?? {},
      lastMatchAt: existingUser?.lastMatchAt ?? null,
    });

    const users = existingIndex >= 0
      ? state.users.map((currentUser, index) => (index === existingIndex ? user : currentUser))
      : [user, ...state.users];

    return {
      ...state,
      users,
      currentUserId: user.id,
    };
  });
}

export function signOutLocal() {
  return updateState((state) => ({
    ...state,
    currentUserId: null,
  }));
}

export function createRoom({ title, bestOf, mode }) {
  return updateState((state) => {
    const currentUser = getCurrentUser(state);
    if (!currentUser) {
      return state;
    }

    const code = generateRoomCode(state.rooms);
    const room = normalizeRoom({
      id: createId('room'),
      code,
      title: title?.trim() || `Sala ${code}`,
      hostId: currentUser.id,
      hostName: currentUser.name,
      bestOf,
      mode,
      status: 'waiting',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastMessage: 'Aguardando oponente.',
    });

    return {
      ...state,
      rooms: [room, ...state.rooms],
    };
  });
}

function generateRoomCode(existingRooms) {
  let code = '';
  const values = new Uint8Array(6);

  do {
    crypto.getRandomValues(values);
    code = Array.from(values, (value) => ROOM_CODE_ALPHABET[value % ROOM_CODE_ALPHABET.length]).join('');
  } while (existingRooms.some((room) => room.code === code));

  return code;
}

export function joinRoom(code) {
  const normalizedCode = (code || '').trim().toUpperCase();

  return updateState((state) => {
    const currentUser = getCurrentUser(state);
    if (!currentUser || !normalizedCode) {
      return state;
    }

    const index = state.rooms.findIndex((room) => room.code === normalizedCode);
    if (index === -1) {
      return state;
    }

    const room = state.rooms[index];
    if (room.hostId === currentUser.id || room.opponentId === currentUser.id) {
      return state;
    }

    if (room.status === 'completed') {
      return state;
    }

    const updatedRoom = normalizeRoom({
      ...room,
      opponentId: currentUser.id,
      opponentName: currentUser.name,
      status: 'active',
      updatedAt: nowIso(),
      lastMessage: `${currentUser.name} entrou na sala.`,
    });

    return {
      ...state,
      rooms: state.rooms.map((currentRoom, roomIndex) => (roomIndex === index ? updatedRoom : currentRoom)),
    };
  });
}

export function leaveRoom(code) {
  const normalizedCode = (code || '').trim().toUpperCase();

  return updateState((state) => {
    const currentUser = getCurrentUser(state);
    if (!currentUser || !normalizedCode) {
      return state;
    }

    const index = state.rooms.findIndex((room) => room.code === normalizedCode);
    if (index === -1) {
      return state;
    }

    const room = state.rooms[index];
    if (room.hostId === currentUser.id) {
      return {
        ...state,
        rooms: state.rooms.filter((_, roomIndex) => roomIndex !== index),
      };
    }

    if (room.opponentId !== currentUser.id) {
      return state;
    }

    const updatedRoom = normalizeRoom({
      ...room,
      opponentId: null,
      opponentName: '',
      status: 'waiting',
      updatedAt: nowIso(),
      lastMessage: `${currentUser.name} saiu da sala.`,
    });

    return {
      ...state,
      rooms: state.rooms.map((currentRoom, roomIndex) => (roomIndex === index ? updatedRoom : currentRoom)),
    };
  });
}

export function recordQuickMatch({
  playerName,
  opponentName = DEFAULT_OPPONENT,
  playerNumber,
  opponentNumber,
  parity,
  total,
  result,
  roundsPlayed,
}) {
  return updateState((state) => {
    const currentUser = getCurrentUser(state);
    if (!currentUser) {
      return state;
    }

    const createdAt = nowIso();
    const updatedCurrentUser = buildUpdatedUser(currentUser, {
      won: result === 'win',
      playerNumber,
      opponentElo: AI_ELO,
      createdAt,
    });

    const users = state.users.map((user) => (user.id === currentUser.id ? updatedCurrentUser : user));
    const match = normalizeMatch({
      id: createId('match'),
      type: 'quick',
      playerId: currentUser.id,
      playerName: playerName || currentUser.name,
      opponentName,
      result,
      roundsPlayed,
      playerNumber,
      opponentNumber,
      total,
      parity,
      createdAt,
    });

    return {
      ...state,
      users,
      matches: [match, ...state.matches].slice(0, 50),
    };
  });
}

export function recordRoomMatch({
  roomCode,
  winnerId,
  playerId,
  opponentId,
  playerName,
  opponentName,
  playerNumber,
  opponentNumber,
  parity,
  total,
  roundsPlayed,
}) {
  return updateState((state) => {
    const createdAt = nowIso();
    const playersById = new Map(state.users.map((user) => [user.id, user]));
    const primaryPlayer = playersById.get(playerId);
    if (!primaryPlayer) {
      return state;
    }

    const opponent = opponentId ? playersById.get(opponentId) : null;
    const updatedUsers = state.users.map((user) => {
      if (user.id === playerId) {
        return buildUpdatedUser(user, {
          won: winnerId === playerId,
          playerNumber,
          opponentElo: opponent ? opponent.elo : AI_ELO,
          createdAt,
        });
      }

      if (opponent && user.id === opponentId) {
        return buildUpdatedUser(user, {
          won: winnerId === opponentId,
          playerNumber: opponentNumber,
          opponentElo: primaryPlayer.elo,
          createdAt,
        });
      }

      return user;
    });

    const match = normalizeMatch({
      id: createId('match'),
      type: 'room',
      roomCode,
      playerId,
      playerName: playerName || primaryPlayer.name,
      opponentId: opponent?.id || null,
      opponentName: opponentName || opponent?.name || DEFAULT_OPPONENT,
      result: winnerId === playerId ? 'win' : 'loss',
      roundsPlayed,
      playerNumber,
      opponentNumber,
      total,
      parity,
      createdAt,
    });

    return {
      ...state,
      users: updatedUsers,
      rooms: state.rooms.map((room) => {
        if (room.code !== roomCode) {
          return room;
        }

        return normalizeRoom({
          ...room,
          status: 'completed',
          updatedAt: createdAt,
          lastMessage: `${match.playerName} venceu a sala.`,
        });
      }),
      matches: [match, ...state.matches].slice(0, 50),
    };
  });
}

export function getRoomByCode(state, code) {
  const normalizedCode = (code || '').trim().toUpperCase();
  return normalizeState(state).rooms.find((room) => room.code === normalizedCode) || null;
}

export function getCurrentUserStats(state) {
  const currentUser = getCurrentUser(state);

  if (!currentUser) {
    return {
      name: 'Visitante',
      elo: DEFAULT_ELO,
      wins: 0,
      losses: 0,
      streak: 0,
      bestStreak: 0,
      matchesPlayed: 0,
      favoriteNumber: null,
      winRate: 0,
    };
  }

  const matchesPlayed = currentUser.matchesPlayed || 0;
  const wins = currentUser.wins || 0;
  const losses = currentUser.losses || 0;

  return {
    name: currentUser.name,
    elo: currentUser.elo,
    wins,
    losses,
    streak: currentUser.streak || 0,
    bestStreak: currentUser.bestStreak || 0,
    matchesPlayed,
    favoriteNumber: currentUser.favoriteNumber,
    winRate: matchesPlayed === 0 ? 0 : Math.round((wins / matchesPlayed) * 100),
  };
}

export function useLeaderboard() {
  const state = useMvpState();
  return useMemo(() => getLeaderboard(state), [state]);
}

export function useCurrentUser() {
  const state = useMvpState();
  return useMemo(() => getCurrentUser(state), [state]);
}

export function useCurrentUserStats() {
  const state = useMvpState();
  return useMemo(() => getCurrentUserStats(state), [state]);
}
