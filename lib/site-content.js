export const primaryRoutes = [
  { href: '/', label: 'Início' },
  { href: '/mvp', label: 'MVP' },
  { href: '/mvp/partida-rapida', label: 'Partida rápida' },
  { href: '/mvp/salas-privadas', label: 'Salas privadas' },
  { href: '/mvp/ranking', label: 'Ranking' },
  { href: '/login', label: 'Login' },
];

export const mvpCards = [
  {
    title: 'Cadastro e login',
    description: 'Autenticação com Supabase Auth para entrar no app e iniciar partidas.',
  },
  {
    title: 'Partida rápida',
    description: 'Fila automática com confronto melhor de 3 e intervalo 0–10.',
  },
  {
    title: 'Salas privadas',
    description: 'Criação de lobby com link compartilhável para amigos.',
  },
  {
    title: 'Ranking Elo',
    description: 'Ligas iniciais com progressão por faixas e base para temporadas futuras.',
  },
  {
    title: 'Estatísticas básicas',
    description: 'Vitórias, derrotas, taxa de vitória, sequência e histórico recente.',
  },
  {
    title: 'IA Aleatória',
    description: 'Fallback quando não houver jogadores disponíveis em modos sem premiação financeira.',
  },
];

export const rankingTiers = [
  ['Bronze', '0–999'],
  ['Prata', '1000–1199'],
  ['Ouro', '1200–1399'],
  ['Platina', '1400–1599'],
  ['Diamante', '1600–1799'],
  ['Mestre', '1800–1999'],
  ['Lendário', '2000+'],
];

export const quickMatchSteps = [
  'Entrar na fila.',
  'Receber um oponente ou IA.',
  'Escolher número e Par/Ímpar.',
  'Confirmar a rodada com resolução simultânea.',
  'Vencer a melhor de 3 em menos de 1 minuto.',
];

export const privateRoomFeatures = [
  'Link compartilhável',
  'Melhor de 3, 5 ou 7',
  'Seleção de modo de jogo',
  'Preparado para futuras salas sociais',
];
