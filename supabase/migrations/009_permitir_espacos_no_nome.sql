-- Migration: 009_permitir_espacos_no_nome
-- Descrição: Permite espaços no nome de usuário, atualizando a trigger
-- de signup e sincronizando user_metadata ao alterar nome.

-- ============================================================
-- 1. Atualiza a trigger para permitir espaços (e manter acentos)
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
    NEW.raw_user_meta_data ->> 'apelido',
    split_part(NEW.email, '@', 1)
  );

  -- Remove apenas caracteres de controle, mantém letras acentuadas, números, espaços, underscore, hífen, ponto
  base_nome := regexp_replace(base_nome, '[\x00-\x1f\x7f"''<>]', '', 'g');

  -- Normaliza espaços múltiplos para um único espaço
  base_nome := regexp_replace(base_nome, '\s+', ' ', 'g');

  -- Garante mínimo de 2 caracteres
  IF length(base_nome) < 2 THEN
    base_nome := base_nome || '1';
    IF length(base_nome) < 2 THEN
      base_nome := 'j1';
    END IF;
  END IF;

  -- Trunca para no máximo 24 caracteres (preservando palavras completas se possível)
  IF length(base_nome) > 24 THEN
    base_nome := left(base_nome, 24);
    -- Remove espaço no final se houver
    base_nome := regexp_replace(base_nome, '\s+$', '');
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
