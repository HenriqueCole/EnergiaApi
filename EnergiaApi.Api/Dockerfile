# --- Estagio 1: build/publish (SDK, imagem grande, descartada no final) ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia so o .csproj primeiro: enquanto as dependencias nao mudam,
# o Docker reaproveita a camada de restore em cache.
COPY ["EnergiaApi.Api/EnergiaApi.Api.csproj", "EnergiaApi.Api/"]
RUN dotnet restore "EnergiaApi.Api/EnergiaApi.Api.csproj"

COPY . .
RUN dotnet publish "EnergiaApi.Api/EnergiaApi.Api.csproj" \
    -c Release --no-restore -o /app/publish

# --- Estagio 2: runtime (so o ASP.NET Core, sem SDK nem codigo-fonte) ---
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Roda como usuario sem privilegios (APP_UID=1654 ja vem definido na imagem base).
USER $APP_UID

ENTRYPOINT ["dotnet", "EnergiaApi.Api.dll"]
