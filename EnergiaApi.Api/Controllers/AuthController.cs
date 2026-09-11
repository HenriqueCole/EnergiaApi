using EnergiaApi.Api.Services;
using EnergiaApi.Api.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace EnergiaApi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ITokenService _tokenService;

    public AuthController(ITokenService tokenService) => _tokenService = tokenService;

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginViewModel login)
    {
        if (login.Usuario != "admin" || login.Senha != "123456")
            return Unauthorized(new { mensagem = "Credenciais inválidas." });

        var token = _tokenService.GerarToken(login.Usuario, "Admin");
        return Ok(new { token });
    }
}
