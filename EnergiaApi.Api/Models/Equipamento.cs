namespace EnergiaApi.Api.Models;

public class Equipamento
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Setor { get; set; } = string.Empty;
    public double PotenciaWatts { get; set; }
    public double LimiteConsumoKwh { get; set; }
    public bool Ativo { get; set; } = true;

    public List<LeituraConsumo> Leituras { get; set; } = new();
}
