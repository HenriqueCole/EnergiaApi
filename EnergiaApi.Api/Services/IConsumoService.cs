using EnergiaApi.Api.ViewModels;

namespace EnergiaApi.Api.Services;

public interface IConsumoService
{
    Task<PagedResult<ConsumoViewModel>> ListarConsumosAsync(int page, int pageSize);
    Task<PagedResult<AlertaViewModel>> ListarAlertasAsync(int page, int pageSize);
    Task<ConsumoViewModel> RegistrarLeituraAsync(LeituraInputViewModel input);
    Task<RelatorioViewModel> GerarRelatorioAsync(int equipamentoId);
}
