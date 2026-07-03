import './globals.css';
import Link from 'next/link';
import { primaryRoutes } from '../lib/site-content';

export const metadata = {
  title: 'Campeonato de Par ou Ímpar Online',
  description: 'Plataforma competitiva de Par ou Ímpar com base em Next.js e Supabase.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="brand">
              <strong>Campeonato de Par ou Ímpar</strong>
              <span>Partidas rápidas, simples e competitivas.</span>
            </div>
            <nav className="nav" aria-label="Navegação principal">
              {primaryRoutes.map((route) => (
                <Link key={route.href} href={route.href}>
                  {route.label}
                </Link>
              ))}
            </nav>
          </header>
          <main>{children}</main>
          <footer className="footer">
            Construído como estrutura inicial do MVP com Next.js, React e Supabase Auth.
          </footer>
        </div>
      </body>
    </html>
  );
}
