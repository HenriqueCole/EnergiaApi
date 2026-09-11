# Estagio 1: build e publish. Usa o SDK, que e uma imagem grande, e some no final.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia so o .csproj primeiro. Enquanto as dependencias nao mudam,
# o Docker reaproveita a camada de restore que ja esta em cache.
COPY ["EnergiaApi.Api/EnergiaApi.Api.csproj", "EnergiaApi.Api/"]
RUN dotnet restore "EnergiaApi.Api/EnergiaApi.Api.csproj"

COPY . .
RUN dotnet publish "EnergiaApi.Api/EnergiaApi.Api.csproj" \
    -c Release --no-restore -o /app/publish

# Estagio 2: runtime. So o ASP.NET Core, sem SDK e sem codigo-fonte.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Roda com usuario sem privilegios. O APP_UID=1654 ja vem definido na imagem base.
USER $APP_UID

ENTRYPOINT ["dotnet", "EnergiaApi.Api.dll"]
