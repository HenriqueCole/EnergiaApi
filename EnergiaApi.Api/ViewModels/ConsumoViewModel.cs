namespace EnergiaApi.Api.ViewModels;

public class ConsumoViewModel
{
    public int Id { get; set; }
    public string Equipamento { get; set; } = string.Empty;
    public string Setor { get; set; } = string.Empty;
    public DateTime DataHora { get; set; }
    public double ConsumoKwh { get; set; }
}
