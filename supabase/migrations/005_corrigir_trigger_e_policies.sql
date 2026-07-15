-- Migration: 005_corrigir_trigger_e_policies
-- Descrição: Corrige o trigger de criação de perfil (security definer + search_path)
-- e adiciona as RLS policies para permitir o insert durante o signup

-- ============================================================
-- 1. Recria a função do trigger com segurança
-- ============================================================
CREATE OR REPLACE FUNCTION public.criar_perfil_ao_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.perfis (id_usuario, nome)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Jogador')
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. RLS Policies para perfis
-- ============================================================
CREATE POLICY "perfis_leitura_publica" ON public.perfis
  FOR SELECT
  USING (true);

CREATE POLICY "perfis_insercao_proprio" ON public.perfis
  FOR INSERT
  WITH CHECK (id_usuario = auth.uid());

CREATE POLICY "perfis_insercao_trigger_signup" ON public.perfis
  FOR INSERT
  WITH CHECK (auth.role() IS NULL);

CREATE POLICY "perfis_atualizacao_proprio" ON public.perfis
  FOR UPDATE
  USING (id_usuario = auth.uid())
  WITH CHECK (id_usuario = auth.uid());

CREATE POLICY "perfis_exclusao_proprio" ON public.perfis
  FOR DELETE
  USING (id_usuario = auth.uid());
