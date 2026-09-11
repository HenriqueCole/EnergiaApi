using System.ComponentModel.DataAnnotations;

namespace EnergiaApi.Api.ViewModels;

public class LeituraInputViewModel
{
    [Required(ErrorMessage = "EquipamentoId é obrigatório.")]
    [Range(1, int.MaxValue, ErrorMessage = "EquipamentoId inválido.")]
    public int EquipamentoId { get; set; }

    [Range(0.0, 100000, ErrorMessage = "Consumo deve ser positivo.")]
    public double ConsumoKwh { get; set; }

    public DateTime? DataHora { get; set; }
}
