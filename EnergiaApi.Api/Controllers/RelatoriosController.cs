using EnergiaApi.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EnergiaApi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RelatoriosController : ControllerBase
{
    private readonly IConsumoService _service;

    public RelatoriosController(IConsumoService service) => _service = service;

    [HttpGet("equipamento/{id:int}")]
    public async Task<IActionResult> Get(int id)
        => Ok(await _service.GerarRelatorioAsync(id));
}
