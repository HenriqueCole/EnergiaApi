using EnergiaApi.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EnergiaApi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConsumosController : ControllerBase
{
    private readonly IConsumoService _service;

    public ConsumosController(IConsumoService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(await _service.ListarConsumosAsync(page, pageSize));
}
