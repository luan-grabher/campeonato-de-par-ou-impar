-- Migration: 006_nome_de_usuario_unico
-- Descrição: Adiciona UNIQUE constraint ao campo nome (identificador único do jogador)
-- e atualiza o trigger de signup para usar o nome fornecido no cadastro ou
-- gerar automaticamente a partir do email (OAuth).
-- O nome pode ser alterado pelo usuário, desde que o novo nome não exista.
--
-- ATENÇÃO: Execute o script scripts/backfill-nomes.ts ANTES desta migration para garantir
-- que todos os nomes existentes sejam únicos.

-- ============================================================
-- 1. Adiciona UNIQUE constraint ao campo nome
-- ============================================================
-- Só adiciona se ainda não existir (idempotente para reexecução)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'perfis_nome_unique'
    AND conrelid = 'public.perfis'::regclass
  ) THEN
    ALTER TABLE public.perfis ADD CONSTRAINT perfis_nome_unique UNIQUE (nome);
  END IF;
END
$$;

-- ============================================================
-- 2. Atualiza o trigger para usar nome vindo do cadastro ou do email
-- ============================================================
CREATE OR REPLACE FUNCTION public.criar_perfil_ao_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  base_nome TEXT;
  nome_final TEXT;
  contador INTEGER := 0;
BEGIN
  -- Prioridade 1: nome_de_usuario enviado no user_metadata (cadastro via form)
  -- Prioridade 2: prefixo do email (signup via OAuth)
  base_nome := COALESCE(
    NEW.raw_user_meta_data ->> 'nome_de_usuario',
    split_part(NEW.email, '@', 1)
  );

  -- Limpa caracteres especiais (mantém apenas letras, números, underscore, hífen, ponto)
  base_nome := regexp_replace(base_nome, '[^a-zA-Z0-9._-]', '', 'g');

  -- Garante mínimo de 2 caracteres
  IF length(base_nome) < 2 THEN
    base_nome := base_nome || '1';
    IF length(base_nome) < 2 THEN
      base_nome := 'j1';
    END IF;
  END IF;

  -- Trunca para no máximo 24 caracteres
  IF length(base_nome) > 24 THEN
    base_nome := left(base_nome, 24);
  END IF;

  -- Garante unicidade: se o nome já existir, adiciona sufixo numérico
  nome_final := base_nome;
  WHILE EXISTS (SELECT 1 FROM public.perfis WHERE nome = nome_final) LOOP
    contador := contador + 1;
    nome_final := left(base_nome, 24 - length(contador::TEXT)) || contador::TEXT;
  END LOOP;

  INSERT INTO public.perfis (id_usuario, nome)
  VALUES (NEW.id, nome_final);

  RETURN NEW;
END;
$$;

-- ============================================================
-- 3. Remove o CHECK antigo de nome >= 2 (agora tratado na função)
-- ============================================================
ALTER TABLE public.perfis DROP CONSTRAINT IF EXISTS perfis_nome_check;

-- ============================================================
-- 4. Adiciona um novo CHECK que garante nome não vazio
-- ============================================================
ALTER TABLE public.perfis ADD CONSTRAINT perfis_nome_check
  CHECK (char_length(nome) >= 1);
