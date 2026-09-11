namespace EnergiaApi.Api.ViewModels;

public class AlertaViewModel
{
    public int Id { get; set; }
    public int EquipamentoId { get; set; }
    public string Equipamento { get; set; } = string.Empty;
    public DateTime DataHora { get; set; }
    public string Mensagem { get; set; } = string.Empty;
    public double ConsumoRegistrado { get; set; }
}
