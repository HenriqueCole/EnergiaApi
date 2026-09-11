namespace EnergiaApi.Api.Models;

public class LeituraConsumo
{
    public int Id { get; set; }
    public int EquipamentoId { get; set; }
    public Equipamento? Equipamento { get; set; }
    public DateTime DataHora { get; set; }
    public double ConsumoKwh { get; set; }
}
