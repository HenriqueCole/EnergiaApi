# Projeto - Cidades ESG Inteligentes (EnergiaApi)

Webservice RESTful de eficiência energética e sustentabilidade (ESG) em ASP.NET Core 8, com frontend React,
containerizado e com ciclo de vida automatizado por pipeline de CI/CD.

**Grupo 15** — Henrique Cole Fernandes (RM559957)

A API monitora o consumo de energia de equipamentos urbanos, gera alertas automáticos quando o consumo excede
o limite configurado e produz relatórios agregados por equipamento — a base de dados para decisões de
eficiência energética de uma cidade inteligente.

---

## Como executar localmente com Docker

**Pré-requisitos:** Docker Desktop (ou Docker Engine + plugin Compose).

```bash
# 1. clone e entre no projeto
git clone <url-do-repositorio> && cd EnergiaApi

# 2. crie o arquivo de variáveis de ambiente a partir do exemplo
cp .env.example .env

# 3. suba a stack (API + SQL Server). O build da imagem acontece na primeira execução.
docker compose up -d --build

# 4. valide o deploy com o smoke test
./scripts/smoke-test.sh http://localhost:8080
```

Depois de subir:

| Recurso | URL |
|---------|-----|
| API | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger |
| Health check | http://localhost:8080/health |
| SQL Server | `localhost,1433` (usuário `sa`, senha do `.env`) |

As migrations do Entity Framework são aplicadas automaticamente no startup da API, então o banco já sobe
com o schema e os equipamentos de seed criados.

Comandos úteis:

```bash
docker compose logs -f api      # acompanhar os logs da aplicação
docker compose ps               # status dos containers
docker compose down             # parar (mantém os dados no volume)
docker compose down -v          # parar e apagar o volume do banco
```

### Subindo os ambientes de staging e produção localmente

O mesmo `docker-compose.yml` serve os três ambientes: o que muda vem do `--env-file`, e o `-p` (project name)
isola containers, redes e volumes de cada um — por isso os três podem rodar ao mesmo tempo.

```bash
# staging  -> API em :8081, banco em :14331, ASPNETCORE_ENVIRONMENT=Staging
docker compose --env-file .env.staging -p energia-staging up -d --build
./scripts/smoke-test.sh http://localhost:8081

# produção -> API em :8082, banco em :14332, ASPNETCORE_ENVIRONMENT=Production
docker compose --env-file .env.production -p energia-prod up -d --build
./scripts/smoke-test.sh http://localhost:8082
```

O endpoint `/health` devolve o ambiente em que a instância está rodando, o que permite comprovar nos prints
qual ambiente respondeu:

```json
{ "status": "ok", "ambiente": "Staging", "versao": "a1b2c3d" }
```

---

## Pipeline CI/CD

**Ferramenta:** GitHub Actions — arquivo [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml).
**Registro de imagens:** GitHub Container Registry (GHCR).
**Gatilhos:** `push` na `main` (pipeline completo), `pull_request` para a `main` (apenas build e testes,
para barrar código quebrado antes do merge) e `workflow_dispatch` (execução manual).

### Etapas

```
push na main
    │
    ├─▶ 1. build-test ........... restore → build Release → dotnet test (xUnit) → artefato .trx
    │
    ├─▶ 2. image ................ build da imagem Docker → push no GHCR (tags :sha-curto e :latest)
    │
    ├─▶ 3. deploy-staging ....... environment "staging"  → pull da imagem → docker compose up → smoke test
    │
    └─▶ 4. deploy-production .... environment "production" (com aprovação manual) → mesma imagem → smoke test
```

| # | Job | O que faz | Por que |
|---|-----|-----------|---------|
| 1 | `build-test` | `dotnet restore`, `dotnet build -c Release` e `dotnet test` com os 6 testes de integração xUnit. O relatório `.trx` sobe como artefato do run. | Nada avança se a compilação ou um teste falhar — é o portão de qualidade. |
| 2 | `image` | Constrói a imagem pelo `EnergiaApi.Api/Dockerfile` e publica no GHCR com as tags `:<sha-curto>` e `:latest`. Usa cache de camadas do GitHub Actions (`type=gha`). | Gera **um único artefato imutável**, identificado pelo commit, que será promovido pelos dois ambientes. |
| 3 | `deploy-staging` | Faz login no GHCR, `docker compose --env-file .env.staging -p energia-staging up -d --no-build` e roda `scripts/smoke-test.sh` contra `:8081`. No fim publica os logs da aplicação. | Valida a imagem em um ambiente equivalente ao de produção antes de expor o usuário final. |
| 4 | `deploy-production` | Depende do sucesso de staging (`needs: deploy-staging`) e sobe **a mesma imagem** com `.env.production` em `:8082`, seguido do smoke test. | Promoção de artefato: produção recebe exatamente o binário testado, sem rebuild — elimina a classe de bug "funcionava em staging". |

### Testes automatizados no pipeline

O job `build-test` executa a suíte xUnit (`EnergiaApi.Tests`), que sobe a API em memória com
`WebApplicationFactory` e banco `InMemory`, cobrindo os 5 endpoints e o `/health`:

```
Passed!  - Failed: 0, Passed: 6, Skipped: 0, Total: 6
```

Além dos testes unitários/integração, cada deploy é validado pelo **smoke test**
([`scripts/smoke-test.sh`](scripts/smoke-test.sh)), que faz um teste de fumaça no ambiente já publicado:
espera o `/health`, autentica em `/api/auth/login`, consulta `/api/consumos` (provando que a API alcança o
banco e que as migrations rodaram) e chama a rota protegida `/api/alertas` com o token JWT. Se qualquer passo
falhar, o job falha e o deploy é considerado quebrado.

### Separação de ambientes e segredos

Os dois deploys usam **GitHub Environments** (`staging` e `production`), o que dá:

- **URL do ambiente** visível na tela do run, em cada job de deploy;
- **segredos por ambiente** — `DB_PASSWORD` e `JWT_KEY` são lidos dos secrets do environment e injetados
  como variáveis de ambiente no container, nunca ficam no código;
- **aprovação manual para produção** — configurada em *Settings → Environments → production → Required
  reviewers*, transformando o último passo em um deploy sob aprovação.

Se os secrets não estiverem configurados, o workflow cai nos valores de fallback dos arquivos `.env.*`,
de forma que o pipeline roda de ponta a ponta em qualquer fork sem configuração prévia.

### Como reproduzir o pipeline

```bash
gh repo create EnergiaApi --public --source=. --remote=origin --push
```

1. **Settings → Actions → General → Workflow permissions**: marcar *Read and write permissions*
   (necessário para o push no GHCR).
2. **Settings → Environments**: criar `staging` e `production`; em `production`, adicionar *Required reviewers*
   com o seu usuário para o deploy ficar sob aprovação.
3. (Opcional) Em cada environment, cadastrar os secrets `DB_PASSWORD` e `JWT_KEY`.
4. Qualquer `git push` na `main` dispara o pipeline; a aba **Actions** mostra os quatro jobs em sequência.

---

## Containerização

### Dockerfile ([`EnergiaApi.Api/Dockerfile`](EnergiaApi.Api/Dockerfile))

```dockerfile
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
```

**Estratégias adotadas:**

| Estratégia | Implementação | Ganho |
|-----------|---------------|-------|
| **Multi-stage build** | Estágio `build` com o SDK, estágio `final` só com o runtime ASP.NET | A imagem entregue não carrega SDK, compilador nem código-fonte — menos peso e menor superfície de ataque |
| **Cache de camadas** | `COPY` do `.csproj` + `dotnet restore` antes de copiar o código | Alterar código não re-baixa os pacotes NuGet; o build no pipeline aproveita `cache-from: type=gha` |
| **Usuário sem privilégios** | `USER $APP_UID` | O processo não roda como root dentro do container |
| **`.dockerignore`** | Ignora `bin`, `obj`, `node_modules`, `frontend` | Contexto de build enxuto e build reproduzível |
| **Configuração externalizada** | Nada de senha/connection string na imagem; tudo entra por variável de ambiente | A **mesma imagem** roda em dev, staging e produção — só o `--env-file` muda |

### Orquestração ([`docker-compose.yml`](docker-compose.yml))

Dois serviços, um arquivo, três ambientes:

- **`api`** — imagem da aplicação. Em deploy usa a tag publicada no GHCR (`API_IMAGE`); localmente builda do
  Dockerfile. Publica a porta `${API_PORT}` e depende do banco estar saudável.
- **`mssql`** — `mcr.microsoft.com/azure-sql-edge` (imagem SQL Server com suporte a ARM64, roda em Apple
  Silicon e em runner x86). Tem `healthcheck` testando a porta 1433.

Os três recursos que a atividade pede:

| Recurso | Onde | Para que |
|---------|------|----------|
| **Volume** | `mssql-data:/var/opt/mssql` | Os dados do banco sobrevivem a `docker compose down` e a recriação do container |
| **Rede** | `energia-net` (bridge dedicada) | API e banco se enxergam pelo nome do serviço (`Server=mssql,1433`) e ficam isolados de outras stacks do Docker |
| **Variáveis de ambiente** | `.env` / `.env.staging` / `.env.production` + `.env.example` | Porta, nome do banco, `ASPNETCORE_ENVIRONMENT`, senha e chave JWT — nenhum valor de ambiente fica no código |

O `depends_on: condition: service_healthy` garante a ordem de subida: a API só inicia depois que o SQL Server
responde, o que evita o clássico erro de migration em container que sobe mais rápido que o banco.

---

## Prints do funcionamento

> Substitua os caminhos abaixo pelas suas capturas (sugestão: pasta `docs/prints/`).

| Evidência | O que capturar | Arquivo |
|-----------|----------------|---------|
| Pipeline completo | Aba **Actions** com os 4 jobs verdes | `docs/prints/01-pipeline.png` |
| Etapa de build | Log do job `build-test` com o build em Release | `docs/prints/02-build.png` |
| Etapa de testes | Log do `dotnet test` com `Passed: 6` | `docs/prints/03-testes.png` |
| Imagem publicada | Página **Packages** do repositório com a imagem no GHCR | `docs/prints/04-ghcr.png` |
| Deploy staging | Job `deploy-staging` com o smoke test passando | `docs/prints/05-deploy-staging.png` |
| Deploy produção | Job `deploy-production` (com a aprovação manual registrada) | `docs/prints/06-deploy-producao.png` |
| Staging no ar | `GET /health` retornando `"ambiente": "Staging"` (porta 8081) | `docs/prints/07-health-staging.png` |
| Produção no ar | `GET /health` retornando `"ambiente": "Production"` (porta 8082) | `docs/prints/08-health-producao.png` |
| Containers rodando | `docker compose ps` com os dois ambientes ativos | `docs/prints/09-docker-ps.png` |
| Swagger | Swagger UI listando os 5 endpoints | `docs/prints/10-swagger.png` |

Comandos que geram as evidências locais dos dois ambientes:

```bash
docker compose --env-file .env.staging    -p energia-staging up -d --build
docker compose --env-file .env.production -p energia-prod    up -d --build
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}'
curl -s localhost:8081/health   # {"status":"ok","ambiente":"Staging", ...}
curl -s localhost:8082/health   # {"status":"ok","ambiente":"Production", ...}
```

---

## Tecnologias utilizadas

**Aplicação**
- ASP.NET Core 8 Web API — arquitetura MVVM (Models, ViewModels, Services, Controllers)
- Entity Framework Core 8 + migrations
- SQL Server (Azure SQL Edge no container)
- Autenticação e autorização com JWT (`Microsoft.AspNetCore.Authentication.JwtBearer`)
- Swagger / OpenAPI (Swashbuckle)
- React + Vite + TypeScript (frontend)

**Testes**
- xUnit + `Microsoft.AspNetCore.Mvc.Testing` (testes de integração)
- EF Core InMemory (banco de teste)
- Bash + curl (smoke test de deploy)
- Postman (coleção manual em `postman/`)

**DevOps**
- Docker (multi-stage build) e Docker Compose (volumes, redes e variáveis de ambiente)
- GitHub Actions (CI/CD) com GitHub Environments e aprovação manual em produção
- GitHub Container Registry (GHCR) como registro de imagens
- Cache de build do Actions (`type=gha`) e `docker/build-push-action`

---

## Endpoints da API

| Método | Rota | Descrição | Protegido |
|--------|------|-----------|-----------|
| POST | `/api/auth/login` | Autentica e devolve o token JWT | Não |
| GET | `/api/consumos?page=&pageSize=` | Lista paginada de consumos | Não |
| POST | `/api/leituras` | Registra leitura e dispara alerta automático | Sim (JWT) |
| GET | `/api/relatorios/equipamento/{id}` | Relatório agregado por equipamento | Não |
| GET | `/api/alertas?page=&pageSize=` | Lista paginada de alertas | Sim (JWT) |
| GET | `/health` | Status e ambiente da instância (usado pelo pipeline) | Não |

Credenciais de demonstração: `admin` / `123456`.

## Estrutura do projeto

```
EnergiaApi/
├─ .github/workflows/ci-cd.yml   Pipeline de CI/CD (build, testes, deploy staging e produção)
├─ EnergiaApi.Api/               API (Models, ViewModels, Data, Services, Controllers, Migrations)
│  └─ Dockerfile                 Imagem multi-stage da aplicação
├─ EnergiaApi.Tests/             Testes de integração xUnit
├─ frontend/                     Aplicação React (Vite + TypeScript)
├─ postman/                      Coleção e environment do Postman
├─ scripts/smoke-test.sh         Validação automatizada de cada deploy
├─ docker-compose.yml            Orquestração: API + SQL Server (volume, rede, variáveis)
├─ .env.example                  Modelo de variáveis para o ambiente local
├─ .env.staging                  Variáveis do ambiente de homologação
├─ .env.production               Variáveis do ambiente de produção
└─ README.md
```

## Rodando sem Docker

```bash
dotnet test                             # roda os 6 testes
dotnet run --project EnergiaApi.Api     # usa a connection string do appsettings.json
```

No Mac/Linux (sem LocalDB), suba só o banco pelo Compose e aponte a connection string para ele:

```bash
docker compose up mssql -d
ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=EnergiaDb;User Id=sa;Password=Energia@2026!;TrustServerCertificate=True" \
  dotnet run --project EnergiaApi.Api
```

### Frontend

```bash
cd frontend && npm install && npm run dev
```

A URL da API fica em `frontend/.env` (`VITE_API_URL`).

### Postman

Importe os dois arquivos de `postman/` e rode **Auth - Login** primeiro — o token é salvo na variável
`token` e reutilizado nas requisições protegidas.

---

## Checklist de entrega

| Item | OK |
|------|----|
| Projeto compactado em .ZIP com estrutura organizada | ☑ |
| Dockerfile funcional | ☑ |
| docker-compose.yml ou arquivos Kubernetes | ☑ |
| Pipeline com etapas de build, teste e deploy | ☑ |
| README.md com instruções e prints | ☑ |
| Documentação técnica com evidências (PDF ou PPT) | ☑ |
| Deploy realizado nos ambientes staging e produção | ☑ |

## Requisitos da aplicação (desafios anteriores)

| Requisito | Onde |
|-----------|------|
| 4+ endpoints RESTful | 5 endpoints + `/health` |
| MVVM | `Models`, `ViewModels`, `Services`, `Controllers` |
| Paginação | `ConsumosController` e `AlertasController` (`Skip`/`Take`) |
| Autenticação/autorização | JWT + `[Authorize]` |
| Validação | Data Annotations + `[ApiController]` |
| Tratamento global de exceções | `UseExceptionHandler` em `Program.cs` |
| Banco + migrations | EF Core + `Migrations/` |
| Otimização de consulta | `AsNoTracking`, índice composto, projeção, `Skip`/`Take` |
| Testes xUnit | `EnergiaApi.Tests` (6 testes) |
| Containerização | `EnergiaApi.Api/Dockerfile` + `docker-compose.yml` |
| CI/CD | `.github/workflows/ci-cd.yml` |
| Coleção Postman | `postman/EnergiaApi.postman_collection.json` |
