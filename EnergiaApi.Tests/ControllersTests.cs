using System.Net.Http.Json;

namespace EnergiaApi.Tests;

public class ControllersTests : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client;

    public ControllersTests(ApiFactory factory) => _client = factory.CreateClient();

    [Fact]
    public async Task GetConsumos_RetornaStatus200()
    {
        var response = await _client.GetAsync("/api/consumos");
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task GetRelatorio_RetornaStatus200()
    {
        var response = await _client.GetAsync("/api/relatorios/equipamento/1");
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Login_RetornaStatus200()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new { usuario = "admin", senha = "123456" });
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task PostLeitura_ComToken_RetornaSucesso()
    {
        var login = await _client.PostAsJsonAsync("/api/auth/login",
            new { usuario = "admin", senha = "123456" });
        var token = (await login.Content.ReadFromJsonAsync<TokenDto>())!.Token;

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/leituras");
        request.Headers.Add("Authorization", $"Bearer {token}");
        request.Content = JsonContent.Create(new { equipamentoId = 1, consumoKwh = 5.0 });

        var response = await _client.SendAsync(request);
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task GetAlertas_ComToken_RetornaStatus200()
    {
        var login = await _client.PostAsJsonAsync("/api/auth/login",
            new { usuario = "admin", senha = "123456" });
        var token = (await login.Content.ReadFromJsonAsync<TokenDto>())!.Token;

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/alertas");
        request.Headers.Add("Authorization", $"Bearer {token}");

        var response = await _client.SendAsync(request);
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task GetHealth_RetornaStatus200()
    {
        // O smoke test do pipeline depende deste endpoint.
        var response = await _client.GetAsync("/health");
        response.EnsureSuccessStatusCode();
    }

    private record TokenDto(string Token);
}
