-- RLS Policies: 001_todas_as_policies
-- Descrição: Habilita RLS em todas as tabelas e define policies granulares
-- Regra geral: usuário autenticado só vê/altera seus próprios dados
-- Service role (Server Actions) bypassa RLS

-- ============================================================
-- PERFIS
-- ============================================================
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- Leitura: o usuário vê o próprio perfil e perfis de outros jogadores (para exibir em partidas/ranking)
CREATE POLICY "perfis_leitura_publica" ON perfis
  FOR SELECT
  USING (true);

-- Inserção: o trigger de signup (sem auth) ou o próprio usuário autenticado
CREATE POLICY "perfis_insercao_proprio" ON perfis
  FOR INSERT
  WITH CHECK (id_usuario = auth.uid());

CREATE POLICY "perfis_insercao_trigger_signup" ON perfis
  FOR INSERT
  WITH CHECK (auth.role() IS NULL);

-- Atualização: apenas o próprio usuário pode alterar seu perfil
CREATE POLICY "perfis_atualizacao_proprio" ON perfis
  FOR UPDATE
  USING (id_usuario = auth.uid())
  WITH CHECK (id_usuario = auth.uid());

-- Exclusão: apenas o próprio usuário pode excluir seu perfil
CREATE POLICY "perfis_exclusao_proprio" ON perfis
  FOR DELETE
  USING (id_usuario = auth.uid());

-- ============================================================
-- SALAS PRIVADAS
-- ============================================================
ALTER TABLE salas_privadas ENABLE ROW LEVEL SECURITY;

-- Leitura: todos os autenticados podem ver salas (para encontrar pelo código)
CREATE POLICY "salas_privadas_leitura" ON salas_privadas
  FOR SELECT
  USING (true);

-- Inserção: qualquer autenticado pode criar uma sala
CREATE POLICY "salas_privadas_insercao" ON salas_privadas
  FOR INSERT
  WITH CHECK (id_do_anfitriao = auth.uid());

-- Atualização: apenas o anfitrião pode alterar a sala
CREATE POLICY "salas_privadas_atualizacao_anfitriao" ON salas_privadas
  FOR UPDATE
  USING (id_do_anfitriao = auth.uid())
  WITH CHECK (id_do_anfitriao = auth.uid());

-- Exclusão: apenas o anfitrião pode cancelar/excluir a sala
CREATE POLICY "salas_privadas_exclusao_anfitriao" ON salas_privadas
  FOR DELETE
  USING (id_do_anfitriao = auth.uid());

-- ============================================================
-- CAMPEONATOS
-- ============================================================
ALTER TABLE campeonatos ENABLE ROW LEVEL SECURITY;

-- Leitura: todos os autenticados podem ver campeonatos
CREATE POLICY "campeonatos_leitura" ON campeonatos
  FOR SELECT
  USING (true);

-- Inserção: qualquer autenticado pode criar um campeonato (cliente limitado por UI)
CREATE POLICY "campeonatos_insercao" ON campeonatos
  FOR INSERT
  WITH CHECK (auth.role() IS NOT NULL);

-- Atualização: qualquer autenticado pode alterar (Server Actions validam na camada de negócio)
CREATE POLICY "campeonatos_atualizacao" ON campeonatos
  FOR UPDATE
  USING (auth.role() IS NOT NULL)
  WITH CHECK (auth.role() IS NOT NULL);

-- Exclusão: apenas service role via Server Actions
CREATE POLICY "campeonatos_exclusao" ON campeonatos
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- PARTIDAS
-- ============================================================
ALTER TABLE partidas ENABLE ROW LEVEL SECURITY;

-- Leitura: o jogador vê partidas que participa (como primeiro ou segundo jogador)
CREATE POLICY "partidas_leitura_participante" ON partidas
  FOR SELECT
  USING (
    id_do_primeiro_jogador = auth.uid()
    OR id_do_segundo_jogador = auth.uid()
    OR id_do_primeiro_jogador IS NULL  -- partidas aguardando oponente
  );

-- Inserção: qualquer autenticado pode criar partidas
CREATE POLICY "partidas_insercao" ON partidas
  FOR INSERT
  WITH CHECK (
    id_do_primeiro_jogador = auth.uid()
    OR id_do_segundo_jogador = auth.uid()
  );

-- Atualização: participantes podem atualizar a partida (ex: confirmar entrada, marcar resultado)
CREATE POLICY "partidas_atualizacao_participante" ON partidas
  FOR UPDATE
  USING (
    id_do_primeiro_jogador = auth.uid()
    OR id_do_segundo_jogador = auth.uid()
  )
  WITH CHECK (
    id_do_primeiro_jogador = auth.uid()
    OR id_do_segundo_jogador = auth.uid()
  );

-- Exclusão: apenas service role via Server Actions
CREATE POLICY "partidas_exclusao" ON partidas
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- RODADAS
-- ============================================================
ALTER TABLE rodadas ENABLE ROW LEVEL SECURITY;

-- Leitura: participantes da partida podem ver as rodadas
CREATE POLICY "rodadas_leitura_participante" ON rodadas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partidas
      WHERE partidas.id = rodadas.id_da_partida
      AND (
        partidas.id_do_primeiro_jogador = auth.uid()
        OR partidas.id_do_segundo_jogador = auth.uid()
      )
    )
  );

-- Inserção: participantes podem inserir rodadas (iniciar nova rodada)
CREATE POLICY "rodadas_insercao_participante" ON rodadas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM partidas
      WHERE partidas.id = rodadas.id_da_partida
      AND (
        partidas.id_do_primeiro_jogador = auth.uid()
        OR partidas.id_do_segundo_jogador = auth.uid()
      )
    )
  );

-- Atualização: o jogador pode enviar sua jogada (só altera seus próprios campos)
CREATE POLICY "rodadas_atualizacao_jogada_primeiro" ON rodadas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM partidas
      WHERE partidas.id = rodadas.id_da_partida
      AND partidas.id_do_primeiro_jogador = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM partidas
      WHERE partidas.id = rodadas.id_da_partida
      AND partidas.id_do_primeiro_jogador = auth.uid()
    )
    AND (
      -- Só permite alterar campos do primeiro jogador
      OLD.numero_do_primeiro_jogador IS DISTINCT FROM NEW.numero_do_primeiro_jogador
      OR OLD.paridade_escolhida_pelo_primeiro IS DISTINCT FROM NEW.paridade_escolhida_pelo_primeiro
      OR OLD.token_de_idempotencia_do_primeiro IS DISTINCT FROM NEW.token_de_idempotencia_do_primeiro
      OR OLD.jogada_do_primeiro_confirmada IS DISTINCT FROM NEW.jogada_do_primeiro_confirmada
    )
  );

CREATE POLICY "rodadas_atualizacao_jogada_segundo" ON rodadas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM partidas
      WHERE partidas.id = rodadas.id_da_partida
      AND partidas.id_do_segundo_jogador = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM partidas
      WHERE partidas.id = rodadas.id_da_partida
      AND partidas.id_do_segundo_jogador = auth.uid()
    )
    AND (
      -- Só permite alterar campos do segundo jogador
      OLD.numero_do_segundo_jogador IS DISTINCT FROM NEW.numero_do_segundo_jogador
      OR OLD.paridade_escolhida_pelo_segundo IS DISTINCT FROM NEW.paridade_escolhida_pelo_segundo
      OR OLD.token_de_idempotencia_do_segundo IS DISTINCT FROM NEW.token_de_idempotencia_do_segundo
      OR OLD.jogada_do_segundo_confirmada IS DISTINCT FROM NEW.jogada_do_segundo_confirmada
    )
  );

-- Exclusão: apenas service role
CREATE POLICY "rodadas_exclusao" ON rodadas
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- FILA DE PARTIDA RÁPIDA
-- ============================================================
ALTER TABLE fila_de_partida_rapida ENABLE ROW LEVEL SECURITY;

-- Leitura: o jogador vê sua própria posição na fila
CREATE POLICY "fila_leitura_propria" ON fila_de_partida_rapida
  FOR SELECT
  USING (id_do_jogador = auth.uid());

-- Inserção: o jogador se coloca na fila
CREATE POLICY "fila_insercao_propria" ON fila_de_partida_rapida
  FOR INSERT
  WITH CHECK (id_do_jogador = auth.uid());

-- Exclusão: o jogador sai da fila
CREATE POLICY "fila_exclusao_propria" ON fila_de_partida_rapida
  FOR DELETE
  USING (id_do_jogador = auth.uid());

-- ============================================================
-- PARTICIPANTES DO CAMPEONATO
-- ============================================================
ALTER TABLE participantes_do_campeonato ENABLE ROW LEVEL SECURITY;

-- Leitura: todos veem participantes
CREATE POLICY "participantes_campeonato_leitura" ON participantes_do_campeonato
  FOR SELECT
  USING (true);

-- Inserção: o próprio jogador se inscreve
CREATE POLICY "participantes_campeonato_inscricao" ON participantes_do_campeonato
  FOR INSERT
  WITH CHECK (id_do_jogador = auth.uid());

-- Atualização: service role (Server Actions) ou o próprio jogador
CREATE POLICY "participantes_campeonato_atualizacao" ON participantes_do_campeonato
  FOR UPDATE
  USING (auth.role() = 'service_role' OR id_do_jogador = auth.uid())
  WITH CHECK (auth.role() = 'service_role' OR id_do_jogador = auth.uid());

-- Exclusão: o próprio jogador cancela inscrição
CREATE POLICY "participantes_campeonato_exclusao" ON participantes_do_campeonato
  FOR DELETE
  USING (id_do_jogador = auth.uid());

-- ============================================================
-- AMIGOS
-- ============================================================
ALTER TABLE amigos ENABLE ROW LEVEL SECURITY;

-- Leitura: o jogador vê sua própria lista de amigos
CREATE POLICY "amigos_leitura_propria" ON amigos
  FOR SELECT
  USING (id_do_jogador = auth.uid());

-- Inserção: o jogador adiciona amigos (após convite aceito)
CREATE POLICY "amigos_insercao_propria" ON amigos
  FOR INSERT
  WITH CHECK (id_do_jogador = auth.uid());

-- Exclusão: o jogador remove amigos
CREATE POLICY "amigos_exclusao_propria" ON amigos
  FOR DELETE
  USING (id_do_jogador = auth.uid());

-- ============================================================
-- CONVITES DE AMIZADE
-- ============================================================
ALTER TABLE convites_de_amizade ENABLE ROW LEVEL SECURITY;

-- Leitura: o jogador vê convites que enviou ou recebeu
CREATE POLICY "convites_leitura_envolvido" ON convites_de_amizade
  FOR SELECT
  USING (
    id_do_remetente = auth.uid()
    OR id_do_destinatario = auth.uid()
  );

-- Inserção: o jogador envia convites
CREATE POLICY "convites_insercao_remetente" ON convites_de_amizade
  FOR INSERT
  WITH CHECK (id_do_remetente = auth.uid());

-- Atualização: o destinatário aceita ou recusa
CREATE POLICY "convites_atualizacao_destinatario" ON convites_de_amizade
  FOR UPDATE
  USING (id_do_destinatario = auth.uid())
  WITH CHECK (id_do_destinatario = auth.uid());

-- Exclusão: o remetente pode cancelar o convite
CREATE POLICY "convites_exclusao_remetente" ON convites_de_amizade
  FOR DELETE
  USING (id_do_remetente = auth.uid());

-- ============================================================
-- TEMPORADAS
-- ============================================================
ALTER TABLE temporadas ENABLE ROW LEVEL SECURITY;

-- Leitura: todos veem temporadas
CREATE POLICY "temporadas_leitura" ON temporadas
  FOR SELECT
  USING (true);

-- Inserção/Atualização/Exclusão: apenas service role (admin)
CREATE POLICY "temporadas_administrativo" ON temporadas
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "temporadas_atualizacao_admin" ON temporadas
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "temporadas_exclusao_admin" ON temporadas
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- CONQUISTAS
-- ============================================================
ALTER TABLE conquistas ENABLE ROW LEVEL SECURITY;

-- Leitura: todos veem conquistas disponíveis
CREATE POLICY "conquistas_leitura" ON conquistas
  FOR SELECT
  USING (true);

-- Inserção/Atualização/Exclusão: apenas service role (admin)
CREATE POLICY "conquistas_administrativo" ON conquistas
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "conquistas_atualizacao_admin" ON conquistas
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "conquistas_exclusao_admin" ON conquistas
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- CONQUISTAS DOS JOGADORES
-- ============================================================
ALTER TABLE conquistas_dos_jogadores ENABLE ROW LEVEL SECURITY;

-- Leitura: o jogador vê suas próprias conquistas
CREATE POLICY "conquistas_jogador_leitura_propria" ON conquistas_dos_jogadores
  FOR SELECT
  USING (id_do_jogador = auth.uid());

-- Inserção: service role (Server Actions desbloqueiam)
CREATE POLICY "conquistas_jogador_insercao_admin" ON conquistas_dos_jogadores
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR id_do_jogador = auth.uid());

-- Exclusão: apenas service role
CREATE POLICY "conquistas_jogador_exclusao_admin" ON conquistas_dos_jogadores
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- COSMÉTICOS
-- ============================================================
ALTER TABLE cosmeticos ENABLE ROW LEVEL SECURITY;

-- Leitura: todos veem cosméticos disponíveis na loja
CREATE POLICY "cosmeticos_leitura" ON cosmeticos
  FOR SELECT
  USING (true);

-- Inserção/Atualização/Exclusão: apenas service role (admin)
CREATE POLICY "cosmeticos_administrativo" ON cosmeticos
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "cosmeticos_atualizacao_admin" ON cosmeticos
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "cosmeticos_exclusao_admin" ON cosmeticos
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- COSMÉTICOS DOS JOGADORES
-- ============================================================
ALTER TABLE cosmeticos_dos_jogadores ENABLE ROW LEVEL SECURITY;

-- Leitura: o jogador vê seu próprio inventário
CREATE POLICY "cosmeticos_jogador_leitura_propria" ON cosmeticos_dos_jogadores
  FOR SELECT
  USING (id_do_jogador = auth.uid());

-- Inserção: service role (Server Actions processam compra) ou próprio jogador
CREATE POLICY "cosmeticos_jogador_insercao" ON cosmeticos_dos_jogadores
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR id_do_jogador = auth.uid());

-- Atualização: o jogador pode equipar/remover seus cosméticos
CREATE POLICY "cosmeticos_jogador_equipar" ON cosmeticos_dos_jogadores
  FOR UPDATE
  USING (id_do_jogador = auth.uid())
  WITH CHECK (id_do_jogador = auth.uid());

-- Exclusão: apenas service role
CREATE POLICY "cosmeticos_jogador_exclusao_admin" ON cosmeticos_dos_jogadores
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- REPLAYS
-- ============================================================
ALTER TABLE replays ENABLE ROW LEVEL SECURITY;

-- Leitura: participantes da partida podem ver o replay
CREATE POLICY "replays_leitura_participante" ON replays
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partidas
      WHERE partidas.id = replays.id_da_partida
      AND (
        partidas.id_do_primeiro_jogador = auth.uid()
        OR partidas.id_do_segundo_jogador = auth.uid()
      )
    )
  );

-- Inserção: service role (Server Actions geram replay ao finalizar partida)
CREATE POLICY "replays_insercao_admin" ON replays
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Exclusão: apenas service role
CREATE POLICY "replays_exclusao_admin" ON replays
  FOR DELETE
  USING (auth.role() = 'service_role');
