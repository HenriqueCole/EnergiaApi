using System.ComponentModel.DataAnnotations;

namespace EnergiaApi.Api.ViewModels;

public class LoginViewModel
{
    [Required(ErrorMessage = "Usuário é obrigatório.")]
    public string Usuario { get; set; } = string.Empty;

    [Required(ErrorMessage = "Senha é obrigatória.")]
    public string Senha { get; set; } = string.Empty;
}
