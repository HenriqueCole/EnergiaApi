import { api } from "./client";
import type { Alerta, Consumo, LeituraInput, PagedResult, Relatorio } from "./types";

export function login(usuario: string, senha: string) {
  return api.post<{ token: string }>("/api/auth/login", { usuario, senha });
}

export function listarConsumos(page: number, pageSize: number) {
  return api.get<PagedResult<Consumo>>(`/api/consumos?page=${page}&pageSize=${pageSize}`);
}

export function listarAlertas(page: number, pageSize: number) {
  return api.get<PagedResult<Alerta>>(`/api/alertas?page=${page}&pageSize=${pageSize}`, true);
}

export function registrarLeitura(input: LeituraInput) {
  return api.post<Consumo>("/api/leituras", input, true);
}

export function gerarRelatorio(equipamentoId: number) {
  return api.get<Relatorio>(`/api/relatorios/equipamento/${equipamentoId}`);
}
