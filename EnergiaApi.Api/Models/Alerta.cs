namespace EnergiaApi.Api.Models;

public class Alerta
{
    public int Id { get; set; }
    public int EquipamentoId { get; set; }
    public Equipamento? Equipamento { get; set; }
    public DateTime DataHora { get; set; }
    public string Mensagem { get; set; } = string.Empty;
    public double ConsumoRegistrado { get; set; }
}
