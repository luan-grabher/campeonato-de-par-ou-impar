import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cadastrarUsuario } from '@/servidor/acoes/auth/cadastrarUsuario'
import { loginComEmail } from '@/servidor/acoes/auth/loginComEmail'
import { sairDaConta } from '@/servidor/acoes/auth/sairDaConta'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { acao } = body ?? {}

    switch (acao) {
      case 'cadastrar': {
        const { email, senha, nome } = body ?? {}
        if (!email || !senha) {
          return NextResponse.json({ erro: 'Email e senha obrigatórios.' }, { status: 400 })
        }
        const formData = new FormData()
        formData.set('email', email)
        formData.set('senha', senha)
        if (nome) formData.set('nome', nome)
        const resultado = await cadastrarUsuario(null, formData)
        return NextResponse.json(resultado)
      }

      case 'login-email': {
        const { email, senha } = body ?? {}
        if (!email || !senha) {
          return NextResponse.json({ erro: 'Email e senha obrigatórios.' }, { status: 400 })
        }
        const formDataLogin = new FormData()
        formDataLogin.set('email', email)
        formDataLogin.set('senha', senha)
        const resultado = await loginComEmail(null, formDataLogin)
        return NextResponse.json(resultado)
      }

      case 'login-provedor': {
        const { provedor } = body ?? {}
        if (!provedor) {
          return NextResponse.json({ erro: 'Provedor OAuth é obrigatório.' }, { status: 400 })
        }
        const cookieStore = await cookies()
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          {
            cookies: {
              getAll() { return cookieStore.getAll() },
              setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              },
            },
          }
        )
        const { data } = await supabase.auth.signInWithOAuth({
          provider: provedor,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirmar`,
          },
        })
        if (data?.url) {
          return NextResponse.redirect(data.url)
        }
        return NextResponse.json({ erro: 'Erro ao iniciar login com provedor.' }, { status: 500 })
      }

      case 'sair': {
        const resultado = await sairDaConta()
        return NextResponse.json(resultado)
      }

      default:
        return NextResponse.json({ erro: 'Ação inválida.' }, { status: 400 })
    }
  } catch (erro) {
    console.error('Erro na API auth:', erro)
    return NextResponse.json({ erro: 'Erro interno do servidor.' }, { status: 500 })
  }
}
