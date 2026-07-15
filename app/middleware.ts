import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Rotas que exigem autenticação
const ROTAS_PROTEGIDAS = [
  '/partida-rapida',
  '/ranking',
  '/campeonatos',
  '/salas-privadas',
  '/amigos',
  '/painel-logado',
]

// Rotas de auth (login/cadastro) — redirecionar para / se já logado
const ROTAS_DE_AUTH = ['/login', '/cadastro']

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const pathname = url.pathname

  // Criar cliente Supabase com cookies da request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options: Record<string, unknown>
          }>
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const estaEmRotaProtegida = ROTAS_PROTEGIDAS.some((rota) =>
    pathname.startsWith(rota)
  )
  const estaEmRotaDeAuth = ROTAS_DE_AUTH.some((rota) =>
    pathname.startsWith(rota)
  )

  // Proteger rotas — redirecionar para login se não autenticado
  if (estaEmRotaProtegida && !user) {
    const urlDeLogin = new URL('/login', request.url)
    urlDeLogin.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(urlDeLogin)
  }

  // Se já logado tentar acessar login/cadastro, redirecionar para o dashboard
  if (estaEmRotaDeAuth && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth|partida-rapida-ia).*)',
  ],
}
