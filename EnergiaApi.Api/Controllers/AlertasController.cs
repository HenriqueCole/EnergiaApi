using EnergiaApi.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnergiaApi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AlertasController : ControllerBase
{
    private readonly IConsumoService _service;

    public AlertasController(IConsumoService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(await _service.ListarAlertasAsync(page, pageSize));
}
