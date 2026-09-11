namespace EnergiaApi.Api.Services;

public interface ITokenService
{
    string GerarToken(string usuario, string role);
}
