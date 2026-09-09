/**
 * Tradução dos valores gravados para o que a pessoa lê na tela.
 *
 * O banco guarda `FUNDAMENTAL_INCOMPLETO`, `NAO_DECLARADA`, `UNIAO_ESTAVEL` —
 * formato de máquina, estável, que não muda quando o texto da tela muda. Exibir
 * o valor cru transforma a ficha num despejo de constantes.
 *
 * Fica separado dos componentes porque o mesmo valor aparece em mais de uma
 * tela, e um rótulo divergente entre elas é o tipo de inconsistência que
 * ninguém percebe até alguém perguntar por que "Não declarada" virou
 * "Não informada".
 */

const SEXO: Record<string, string> = {
  MASCULINO: "Masculino",
  FEMININO: "Feminino",
  NAO_BINARIO: "Não binário",
  OUTRO: "Outro",
  NAO_INFORMADO: "Não informado",
};

const ESCOLARIDADE: Record<string, string> = {
  SEM_INSTRUCAO: "Sem instrução",
  FUNDAMENTAL_INCOMPLETO: "Fundamental incompleto",
  FUNDAMENTAL_COMPLETO: "Fundamental completo",
  MEDIO_INCOMPLETO: "Médio incompleto",
  MEDIO_COMPLETO: "Médio completo",
  SUPERIOR_INCOMPLETO: "Superior incompleto",
  SUPERIOR_COMPLETO: "Superior completo",
};

const RACA: Record<string, string> = {
  BRANCA: "Branca",
  PRETA: "Preta",
  PARDA: "Parda",
  AMARELA: "Amarela",
  INDIGENA: "Indígena",
  NAO_DECLARADA: "Não declarada",
};

const ESTADO_CIVIL: Record<string, string> = {
  SOLTEIRO: "Solteiro(a)",
  CASADO: "Casado(a)",
  UNIAO_ESTAVEL: "União estável",
  SEPARADO: "Separado(a)",
  DIVORCIADO: "Divorciado(a)",
  VIUVO: "Viúvo(a)",
};

const IDENTIDADE: Record<string, string> = {
  CISGENERO: "Cisgênero",
  TRANSGENERO: "Transgênero",
  NAO_BINARIO: "Não binário",
  OUTRO: "Outro",
};

const MORADIA: Record<string, string> = {
  PROPRIA: "Própria",
  ALUGADA: "Alugada",
  CEDIDA: "Cedida",
  OCUPACAO: "Ocupação",
  SITUACAO_DE_RUA: "Situação de rua",
};

const CONSTRUCAO: Record<string, string> = {
  ALVENARIA: "Alvenaria",
  MADEIRA: "Madeira",
  MISTA: "Mista",
  PALAFITA: "Palafita",
};

const ZONA: Record<string, string> = { URBANA: "Urbana", RURAL: "Rural" };

const BENEFICIO: Record<string, string> = {
  BOLSA_FAMILIA: "Bolsa Família",
  BPC: "BPC",
  AUXILIO_BRASIL: "Auxílio Brasil",
  SEGURO_DEFESO: "Seguro-defeso",
  NENHUM: "Nenhum",
};

const PARENTESCO: Record<string, string> = {
  FILHO: "Filho", FILHA: "Filha", PAI: "Pai", MAE: "Mãe",
  NETO: "Neto", NETA: "Neta", CONJUGE: "Cônjuge", IRMAO: "Irmão", IRMA: "Irmã",
};

const SITUACAO_BENEFICIARIO: Record<string, string> = {
  ATIVO: "Ativo", INATIVO: "Inativo", EM_ANALISE: "Em análise",
};

const DICIONARIOS = {
  sexo: SEXO,
  escolaridade: ESCOLARIDADE,
  raca: RACA,
  estadoCivil: ESTADO_CIVIL,
  identidade: IDENTIDADE,
  moradia: MORADIA,
  construcao: CONSTRUCAO,
  zona: ZONA,
  beneficio: BENEFICIO,
  parentesco: PARENTESCO,
  situacaoBeneficiario: SITUACAO_BENEFICIARIO,
} as const;

/**
 * Traduz, e devolve o valor cru quando não conhece.
 *
 * Devolver o cru em vez de vazio é deliberado: valor novo no banco aparece
 * feio na tela, o que é um aviso — sumir com ele esconderia a informação e o
 * fato de que a tradução ficou para trás.
 */
export function rotular(
  dicionario: keyof typeof DICIONARIOS,
  valor?: string | null,
): string | null {
  if (!valor) return null;
  return DICIONARIOS[dicionario][valor] ?? valor;
}

export function formatarNIS(nis?: string | null): string | null {
  const digitos = (nis ?? "").replace(/\D/g, "");
  if (digitos.length !== 11) return nis ?? null;
  return digitos.replace(/(\d{3})(\d{5})(\d{2})(\d{1})/, "$1.$2.$3-$4");
}

export function formatarCEP(cep?: string | null): string | null {
  const digitos = (cep ?? "").replace(/\D/g, "");
  if (digitos.length !== 8) return cep ?? null;
  return digitos.replace(/(\d{5})(\d{3})/, "$1-$2");
}

export function formatarTelefone(telefone?: string | null): string | null {
  const digitos = (telefone ?? "").replace(/\D/g, "");
  if (digitos.length === 11) return digitos.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digitos.length === 10) return digitos.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return telefone ?? null;
}

export function formatarDinheiro(valor?: number | null): string | null {
  if (valor === null || valor === undefined) return null;
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Idade em anos, contada sem passar por diferença de milissegundos.
 *
 * Subtrair timestamps e dividir por 365 erra em ano bissexto e em quem faz
 * aniversário hoje. Comparar mês e dia acerta sempre.
 */
export function idadeEmAnos(nascimento?: string | null): number | null {
  if (!nascimento) return null;
  const nasceu = new Date(nascimento);
  if (Number.isNaN(nasceu.getTime())) return null;

  const hoje = new Date();
  let anos = hoje.getFullYear() - nasceu.getUTCFullYear();
  const mes = hoje.getMonth() - nasceu.getUTCMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasceu.getUTCDate())) anos -= 1;
  return anos >= 0 && anos < 130 ? anos : null;
}

/** "62 anos" · "1 ano" · null quando não há data. */
export function faixaEtaria(nascimento?: string | null): string | null {
  const anos = idadeEmAnos(nascimento);
  if (anos === null) return null;
  return anos === 1 ? "1 ano" : `${anos} anos`;
}
