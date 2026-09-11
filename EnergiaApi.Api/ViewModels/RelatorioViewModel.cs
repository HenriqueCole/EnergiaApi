namespace EnergiaApi.Api.ViewModels;

public class RelatorioViewModel
{
    public int EquipamentoId { get; set; }
    public string Equipamento { get; set; } = string.Empty;
    public double ConsumoTotalKwh { get; set; }
    public double ConsumoMedioKwh { get; set; }
    public double MaiorPico { get; set; }
    public int QtdLeituras { get; set; }
    public int QtdAlertas { get; set; }
}
