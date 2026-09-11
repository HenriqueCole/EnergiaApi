using EnergiaApi.Api.Services;
using EnergiaApi.Api.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnergiaApi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeiturasController : ControllerBase
{
    private readonly IConsumoService _service;

    public LeiturasController(IConsumoService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] LeituraInputViewModel input)
    {
        var result = await _service.RegistrarLeituraAsync(input);
        return CreatedAtAction(nameof(Post), new { id = result.Id }, result);
    }
}
