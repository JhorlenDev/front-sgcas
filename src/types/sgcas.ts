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

/*
 * Os tres campos JSON do prontuario seguem o formato da atualizacao do Jhorlen,
 * adotado como padrao: nomes do CadUnico em snake_case. Os valores de
 * vocabulario fechado sao codigos (`PROPRIA`, `URBANA`, `BOLSA_FAMILIA`), e a
 * tela os traduz por `rotular` (lib/rotulos.ts).
 *
 * A base antiga gravava em camelCase; o comando `converter_formato_prontuario`
 * da API renomeia sem perder dado. O que nao tem equivalente no formato novo
 * (`rendaPerCapita`, `tipoConstrucao`...) continua no JSON com o nome antigo, e
 * por isso os tipos abaixo nao o declaram.
 */

/** Uma pessoa da composição familiar. */
export type MembroDaFamilia = {
  nome_membro?: string | null;
  parentesco?: string | null;
  cpf_membro?: string | null;
  /** Explícito, e não CPF em branco: em branco é indistinguível de "ninguém perguntou". */
  nao_possui_cpf?: boolean | null;
  data_nascimento?: string | null;
  escolaridade?: string | null;
};

export type BeneficioRecebido = {
  beneficio_tipo?: string | null;
  beneficio_nome?: string | null;
  beneficio_valor?: number | null;
};

export type Socioeconomico = {
  renda_total?: number | null;
  precedencia_rendimento?: string | null;
  quantidade_pessoas_residencia?: number | null;
  recebe_beneficio?: boolean | null;
  beneficios_recebidos?: BeneficioRecebido[] | null;
  ha_gestante?: boolean | null;
  ha_pessoa_com_deficiencia?: boolean | null;
  servicos_sociais?: string[] | null;
  observacoes_gerais?: string | null;
};

/** Condições da moradia — o endereço em si está nas colunas do cidadão. */
export type EnderecoDetalhado = {
  tipo_localizacao?: string | null;
  situacao_imovel?: string | null;
  abastecimento_agua?: string | null;
  possui_saneamento?: boolean | null;
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
  /** As chaves que `apps/cidadaos/anexos.py::guardar` grava. Não há `nome`. */
  anexos?: { id?: string; tipo_documento?: string; mime?: string; tamanho?: number }[] | null;
  autoriza_imagem?: boolean | null;
  imagem_aceita_em?: string | null;
  imagem_revogada_em?: string | null;
  consentiu_tefe_cidadao_em?: string | null;
  acao_itinerante?: string | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
  integracoes?: {
    tefeCidadao: SituacaoDaIntegracao | null;
    cadastroCentral: SituacaoDaIntegracao | null;
  } | null;
};

/** Como as integracoes externas voltam no POST de cadastro. */
export type SituacaoDaIntegracao = {
  situacao: string;
  mensagem: string | null;
  faltando: string[];
};

/** Um cidadao do cadastro central, ja traduzido para os campos do formulario. */
export type DadosDaCentral = {
  cpf: string | null;
  nome: string | null;
  nascimento: string | null;
  sexo: string | null;
  rg: string | null;
  nis: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  observacoes: string | null;
};

/**
 * Resposta de `GET /citizens/consulta-central`.
 *
 * `situacao` nunca vira erro HTTP: central fora do ar chega como `falhou` e o
 * formulario segue preenchivel a mao.
 */
export type ConsultaCentral = {
  situacao:
    | "encontrado"
    | "nao_encontrado"
    | "cpf_invalido"
    | "falhou"
    | "desligado";
  cidadao: DadosDaCentral | null;
  ja_cadastrado_local: { id: string; nome: string } | null;
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

/** Indicadores do painel do atendente que têm lista de registros por trás. */
export type GrupoDoPainel = "atendidos_hoje" | "aguardando_na_fila" | "finalizados_hoje" | "casos_em_acompanhamento";

/** `GET /queues/painel/:grupo` — envelope paginado com o tipo dos itens. */
export type DetalheDoIndicador =
  | ({ tipo: "senhas" } & Paginado<Senha>)
  | ({ tipo: "casos" } & Paginado<Caso>);

/** Item de `GET /queues/em-atendimento`: a senha, quem atende e se é sua. */
export type SenhaEmAtendimento = Senha & {
  operador_nome: string | null;
  pode_retomar: boolean;
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
  unidade?: string | null;
  unidade_nome: string;
  tecnico_nome?: string | null;
  servico?: string | null;
  servico_nome?: string | null;
  acao_itinerante?: string | null;
  acao_itinerante_titulo?: string | null;
  acao_itinerante_local?: string | null;
  aberto_em: string;
  fechado_em?: string | null;
};

/** Ação itinerante no formato curto (`?compacto=1`), para seletor. */
export type AcaoItineranteCompacta = {
  id: string;
  titulo: string;
  local: string;
  data: string;
};

export type BeneficioEventual = {
  id: string;
  cidadao: string;
  nome_da_pessoa: string;
  tipo: string;
  tipo_rotulo?: string | null;
  tipo_outro?: string | null;
  descricao?: string | null;
  registrado_por_nome?: string | null;
  unidade_nome?: string | null;
  criado_em: string;
};

export type Encaminhamento = {
  id: string;
  caso: string;
  situacao: string;
  motivo: string;
  observacoes?: string | null;
  unidade_destino?: string | null;
  unidade_destino_nome?: string | null;
  destino_externo: string;
  encaminhado_por_nome: string;
  criado_em: string;
};

/** `GET /citizens/:id/prontuario` — a ficha inteira numa chamada. */
export type ProntuarioCidadao = {
  cidadao: Cidadao;
  historico: EntradaHistorico[];
  casos: Caso[];
  atendimentos_recepcao: AtendimentoRecepcao[];
  beneficios_eventuais: BeneficioEventual[];
  encaminhamentos: Encaminhamento[];
  senhas: Senha[];
  anexos: NonNullable<Cidadao["anexos"]>;
  membros_da_familia: MembroDaFamilia[];
  socioeconomico: Socioeconomico;
  documentos: Record<string, string | null>;
  endereco_detalhado: EnderecoDetalhado;
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
