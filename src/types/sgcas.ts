/**
 * Envelope das listagens paginadas da API.
 *
 * `total` é o número de registros que casam com o filtro — não o tamanho da
 * página. É a distinção que faltava: antes a API cortava em 100 e a tela
 * exibia `itens.length` como se fosse o total do município.
 */
export type Paginado<T> = {
  itens: T[];
  total: number;
  pagina: number;
  por_pagina: number;
  paginas: number;
};

export type Papel =
  | "ADMIN"
  | "COORDENADOR"
  | "ASSISTENTE_SOCIAL"
  | "TECNICO"
  | "RECEPCIONISTA"
  | "GESTOR_ACOES_ITINERANTES"
  | "VISUALIZADOR";

export type Unidade = {
  id: string;
  nome: string;
  sigla?: string | null;
  tipo?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  coordenacao?: string | null;
  nome_qualificado?: string | null;
  ativa?: boolean;
};

export type Coordenacao = {
  id: string;
  nome: string;
  sigla: string;
  ativa: boolean;
  superior?: string | null;
};

export type Demanda = {
  id: string;
  nome: string;
  categoria?: string | null;
  ativa: boolean;
};

export type Operador = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
  /** Objeto em /auth/me e em /users/ — os dois formatos foram unificados. */
  unidade: Unidade | null;
  unidade_id?: string | null;
  unidade_nome?: string | null;
};

/** Contagem por situação vinda de /cases/resumo. */
export type ResumoDeCasos = {
  total: number;
  por_situacao: Record<string, number>;
  em_acompanhamento: number;
  finalizados: number;
};

export type CidadaoLista = {
  id: string;
  nome: string;
  cpf?: string | null;
  nascimento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
};

/** Uma pessoa da composição familiar, como o cadastro grava. */
export type MembroDaFamilia = {
  nome?: string | null;
  parentesco?: string | null;
  nascimento?: string | null;
  rendaPropria?: number | null;
};

export type Socioeconomico = {
  rendaFamiliar?: number | null;
  rendaPerCapita?: number | null;
  pessoasNoDomicilio?: number | null;
  situacaoMoradia?: string | null;
  tipoConstrucao?: string | null;
  aguaEncanada?: boolean | null;
  energiaEletrica?: boolean | null;
  coletaDeLixo?: boolean | null;
  beneficios?: string[] | null;
};

export type EnderecoDetalhado = {
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  cep?: string | null;
  zona?: string | null;
  referencia?: string | null;
};

export type Cidadao = CidadaoLista & {
  nis?: string | null;
  rg?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  sexo?: string | null;
  naturalidade?: string | null;
  escolaridade?: string | null;
  identidade_de_genero?: string | null;
  raca?: string | null;
  tem_deficiencia?: boolean | null;
  estado_civil?: string | null;
  observacoes?: string | null;
  documentos?: Record<string, string | null> | null;
  endereco_detalhado?: EnderecoDetalhado | null;
  socioeconomico?: Socioeconomico | null;
  membros_da_familia?: MembroDaFamilia[] | null;
  anexos?: { id?: string; nome?: string; tipo?: string; tamanho?: number }[] | null;
  autoriza_imagem?: boolean | null;
  imagem_aceita_em?: string | null;
  imagem_revogada_em?: string | null;
  consentiu_tefe_cidadao_em?: string | null;
  acao_itinerante?: string | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
};

export type Servico = {
  id: string;
  nome: string;
  descricao?: string | null;
  unidade: string;
  unidade_nome: string;
  demanda_nome?: string | null;
  ativo?: boolean;
};

export type Senha = {
  id: string;
  senha: string;
  situacao: string;
  prioridade: string;
  servico?: string | null;
  cidadao: string;
  cidadao_nome: string;
  chamado_em?: string | null;
  criado_em: string;
};

export type AtendimentoRecepcao = {
  id: string;
  cidadao: string;
  cidadao_nome: string;
  unidade_nome: string;
  atendido_por_nome: string;
  demanda: string;
  desfecho: "ENCAMINHADO" | "FINALIZADO";
  motivo?: string | null;
  observacao?: string | null;
  local_do_atendimento?: string | null;
  caso?: string | null;
  caso_protocolo?: string | null;
  criado_em: string;
};

export type PainelRecepcao = {
  atendimentos_hoje: number;
  finalizados_no_balcao: number;
  encaminhados_para_fila: number;
  aguardando_na_fila: number;
  em_atendimento: number;
  ultimos_atendimentos: AtendimentoRecepcao[];
};

export type Caso = {
  id: string;
  protocolo: string;
  situacao: string;
  prioridade: string;
  descricao?: string | null;
  cidadao: string;
  cidadao_nome: string;
  unidade_nome: string;
  tecnico_nome?: string | null;
  servico?: string | null;
  servico_nome?: string | null;
  aberto_em: string;
  fechado_em?: string | null;
};

export type PainelAtendente = {
  atendidos_hoje: number;
  aguardando_na_fila: number;
  em_atendimento: number;
  finalizados_hoje: number;
  casos_em_acompanhamento: number;
  ultimos_atendimentos: Caso[];
};

export type EntradaHistorico = {
  quando: string;
  unidade: string;
  o_que: string;
  detalhe: string | null;
  quem_atendeu: string | null;
  no_mes_corrente: boolean;
  e_de_outra_unidade: boolean;
};

export type AcaoItinerante = {
  id: string;
  titulo: string;
  descricao?: string | null;
  local: string;
  data: string;
  observacoes?: string | null;
  unidade: string;
  unidade_nome: string;
  responsavel: string;
  responsavel_nome: string;
  ativa: boolean;
  participantes: number;
  cidadaos_atendidos: number;
  beneficios_concedidos: number;
  casos_abertos: number;
  concluida: boolean;
};

export type BalancoAcaoItinerante = AcaoItinerante & {
  balanco: {
    cidadaos_cadastrados: number;
    casos_abertos_vinculados: number;
    beneficios_vinculados: number;
    participantes: number;
    cidadaos_atendidos: number;
    beneficios_concedidos: number;
    casos_abertos: number;
    concluida: boolean;
  };
};

export type ResumoAcoesItinerantes = {
  total_cidadaos: number;
  total_casos: number;
  total_beneficios: number;
  total_acoes: number;
  total_concluidas: number;
};
