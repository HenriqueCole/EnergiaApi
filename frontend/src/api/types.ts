export interface PagedResult<T> {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

export interface Consumo {
  id: number;
  equipamento: string;
  setor: string;
  dataHora: string;
  consumoKwh: number;
}

export interface Alerta {
  id: number;
  equipamentoId: number;
  equipamento: string;
  dataHora: string;
  mensagem: string;
  consumoRegistrado: number;
}

export interface Relatorio {
  equipamentoId: number;
  equipamento: string;
  consumoTotalKwh: number;
  consumoMedioKwh: number;
  maiorPico: number;
  qtdLeituras: number;
  qtdAlertas: number;
}

export interface LeituraInput {
  equipamentoId: number;
  consumoKwh: number;
  dataHora?: string | null;
}
