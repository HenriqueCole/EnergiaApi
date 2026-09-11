# Cidades ESG Inteligentes (EnergiaApi)

Webservice de eficiência energética e sustentabilidade em ASP.NET Core 8, com frontend em React,
rodando em container e com todo o ciclo de build, teste e deploy automatizado.

Grupo 15, Henrique Cole Fernandes (RM559957)

A API monitora o consumo de energia de equipamentos urbanos, dispara alerta quando o consumo passa do
limite configurado e monta relatórios agregados por equipamento. É a base de dados que uma cidade usaria
para decidir onde cortar desperdício de energia.

## Como executar localmente com Docker

Você precisa do Docker Desktop, ou do Docker Engine com o plugin Compose.

```bash
git clone https://github.com/HenriqueCole/EnergiaApi.git
cd EnergiaApi

# copie o modelo de variáveis de ambiente
cp .env.example .env

# sobe a API e o banco. Na primeira vez a imagem é construída, leva alguns minutos.
docker compose up -d --build

# confere se subiu certo
bash scripts/smoke-test.sh http://localhost:8080
```

Depois que os containers sobem:

| Recurso | URL |
|---------|-----|
| API | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger |
| Health check | http://localhost:8080/health |
| SQL Server | `localhost,1433` (usuário `sa`, senha do `.env`) |

As migrations do Entity Framework rodam no startup da API, então o banco já sobe com o schema criado e os
equipamentos de seed inseridos. Não precisa rodar nada à mão.

Comandos do dia a dia:

```bash
docker compose logs -f api      # acompanhar os logs
docker compose ps               # ver o status dos containers
docker compose down             # parar, mantendo os dados no volume
docker compose down -v          # parar e apagar o volume do banco
```

### Subindo staging e produção na sua máquina

O mesmo `docker-compose.yml` atende os três ambientes. O que muda vem do `--env-file`, e o `-p` (nome do
projeto) separa containers, rede e volume de cada um. Por isso os três podem rodar ao mesmo tempo sem brigar
por porta.

```bash
# staging: API na 8081, banco na 14331
docker compose --env-file .env.staging -p energia-staging up -d --build
bash scripts/smoke-test.sh http://localhost:8081

# produção: API na 8082, banco na 14332
docker compose --env-file .env.production -p energia-prod up -d --build
bash scripts/smoke-test.sh http://localhost:8082
```

O `/health` devolve em qual ambiente aquela instância está rodando, o que resolve o problema de provar nos
prints qual das duas respondeu:

```json
{ "status": "ok", "ambiente": "Staging", "versao": "a1b2c3d" }
```

## Pipeline CI/CD

A ferramenta é o GitHub Actions, no arquivo [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml).
As imagens vão para o GitHub Container Registry (GHCR).

O pipeline roda inteiro no `push` da `main`. Em `pull_request` para a `main` só o build e os testes rodam,
para barrar código quebrado antes do merge. Também dá para disparar na mão pelo `workflow_dispatch`.

### Etapas

```
push na main
    │
    ├─▶ 1. build-test ........... restore, build Release, dotnet test (xUnit), artefato .trx
    │
    ├─▶ 2. image ................ build da imagem Docker, push no GHCR (tags :sha-curto e :latest)
    │
    ├─▶ 3. deploy-staging ....... environment "staging", pull da imagem, compose up, smoke test
    │
    └─▶ 4. deploy-production .... environment "production" com aprovação manual, mesma imagem, smoke test
```

| # | Job | O que faz | Por quê |
|---|-----|-----------|---------|
| 1 | `build-test` | Roda `dotnet restore`, `dotnet build -c Release` e `dotnet test` com os 6 testes de integração. O relatório `.trx` fica salvo como artefato do run. | Se a compilação ou um teste falhar, nenhum job depois dele começa. |
| 2 | `image` | Constrói a imagem pelo `EnergiaApi.Api/Dockerfile` e publica no GHCR com as tags `:<sha-curto>` e `:latest`. Usa o cache de camadas do Actions (`type=gha`). | Gera um artefato único, identificado pelo commit, que os dois ambientes vão usar. |
| 3 | `deploy-staging` | Faz login no GHCR, roda `docker compose --env-file .env.staging -p energia-staging up -d --no-build` e executa o smoke test na porta 8081. No fim imprime os logs da aplicação. | Testa a imagem em um ambiente igual ao de produção antes de qualquer coisa chegar no usuário. |
| 4 | `deploy-production` | Só roda se staging passou (`needs: deploy-staging`) e sobe a mesma imagem com `.env.production` na porta 8082, seguido do smoke test. | Produção recebe exatamente o binário que passou em staging, sem rebuild. Aquele bug de "mas funcionava em staging" simplesmente não existe. |

### Testes que rodam no pipeline

O job `build-test` executa a suíte xUnit de `EnergiaApi.Tests`, que sobe a API em memória com
`WebApplicationFactory` e banco InMemory. São 6 testes cobrindo os 5 endpoints de negócio e o `/health`:

```
Passed!  - Failed: 0, Passed: 6, Skipped: 0, Total: 6
```

Cada deploy ainda passa pelo [`scripts/smoke-test.sh`](scripts/smoke-test.sh), que testa o ambiente já
publicado: espera o `/health` responder, autentica em `/api/auth/login`, consulta `/api/consumos` (é aqui
que se prova que a API fala com o banco e que as migrations rodaram) e chama `/api/alertas` com o token JWT.
Qualquer passo que falhe derruba o job.

### Ambientes e segredos

Os dois deploys usam GitHub Environments, um chamado `staging` e outro `production`. Isso dá três coisas:

A URL do ambiente aparece na tela do run, em cada job de deploy. Os segredos ficam separados por ambiente,
então `DB_PASSWORD` e `JWT_KEY` entram no container como variável de ambiente e nunca aparecem no código.
E a produção pode exigir aprovação manual, configurada em Settings, Environments, production, Required
reviewers.

Se os segredos não estiverem cadastrados, o workflow cai nos valores dos arquivos `.env.*` e o pipeline roda
igual. Fiz assim para o projeto poder ser clonado e testado sem configuração prévia.

### Como reproduzir o pipeline

```bash
gh repo create EnergiaApi --public --source=. --remote=origin --push
```

1. Em Settings, Actions, General, marque *Read and write permissions*. Sem isso o push no GHCR falha.
2. Em Settings, Environments, crie `staging` e `production`. Em `production`, adicione seu usuário em
   *Required reviewers* para o deploy ficar sob aprovação.
3. Opcional: cadastre os secrets `DB_PASSWORD` e `JWT_KEY` em cada environment.
4. Qualquer `git push` na `main` dispara o pipeline. A aba Actions mostra os quatro jobs em sequência.

## Containerização

### Dockerfile

Arquivo em [`EnergiaApi.Api/Dockerfile`](EnergiaApi.Api/Dockerfile):

```dockerfile
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
```

O que foi feito e por quê:

| Estratégia | Como | Resultado |
|-----------|------|-----------|
| Build em dois estágios | Estágio `build` com o SDK, estágio `final` só com o runtime | A imagem entregue não leva SDK, compilador nem código-fonte. Fica mais leve e com menos coisa exposta |
| Cache de camadas | `COPY` do `.csproj` e `dotnet restore` antes de copiar o código | Mexer no código não re-baixa os pacotes NuGet. No pipeline o cache também é reaproveitado com `cache-from: type=gha` |
| Usuário sem privilégios | `USER $APP_UID` | O processo não roda como root dentro do container |
| `.dockerignore` | Ignora `bin`, `obj`, `node_modules` e `frontend` | Contexto de build menor e build que dá o mesmo resultado sempre |
| Configuração por fora | Nenhuma senha ou connection string dentro da imagem | A mesma imagem roda em dev, staging e produção. Só o `--env-file` muda |

### Orquestração

O [`docker-compose.yml`](docker-compose.yml) tem dois serviços.

O `api` é a aplicação. Em deploy ele usa a tag publicada no GHCR, que vem na variável `API_IMAGE`.
Localmente ele constrói pelo Dockerfile. Publica a porta `${API_PORT}` e só sobe depois que o banco está
saudável.

O `mssql` é o banco, na imagem `mcr.microsoft.com/azure-sql-edge`. Escolhi essa e não a `mssql/server`
porque tem build para ARM64, então roda tanto no Mac com Apple Silicon quanto no runner x86 do GitHub. Tem
`healthcheck` batendo na porta 1433.

Os três recursos que a atividade pede:

| Recurso | Onde está | Para que serve |
|---------|-----------|----------------|
| Volume | `mssql-data:/var/opt/mssql` | Os dados do banco sobrevivem ao `docker compose down` e à recriação do container |
| Rede | `energia-net`, uma bridge dedicada | API e banco se acham pelo nome do serviço (`Server=mssql,1433`) e ficam isolados de outras stacks do Docker |
| Variáveis de ambiente | `.env`, `.env.staging`, `.env.production` e o modelo `.env.example` | Porta, nome do banco, `ASPNETCORE_ENVIRONMENT`, senha e chave JWT. Nenhum valor de ambiente fica no código |

O `depends_on: condition: service_healthy` cuida da ordem de subida. A API só inicia depois que o SQL Server
responde, o que evita aquele erro de migration em container que sobe mais rápido que o banco.

## Prints do funcionamento

O repositório é público e o histórico de execuções fica aberto, então a evidência aqui é por link em vez de
captura de tela: [github.com/HenriqueCole/EnergiaApi/actions](https://github.com/HenriqueCole/EnergiaApi/actions).

### Pipeline

Execução completa em
[actions/runs/34600183571](https://github.com/HenriqueCole/EnergiaApi/actions/runs/34600183571):

| Job | Resultado | Duração |
|-----|-----------|---------|
| Build e testes | success | 38s |
| Imagem Docker no GHCR | success | 59s |
| Deploy em staging | success | 46s |
| Deploy em producao | success | 44s |

As imagens publicadas aparecem na aba Packages do repositório, com uma tag por commit.

### Staging e produção no ar

Os dois ambientes subindo ao mesmo tempo, cada um com container, rede e volume separados:

```
$ docker ps --filter name=energia --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
NAMES                     PORTS                     STATUS
energia-prod-api-1        0.0.0.0:8082->8080/tcp    Up 22 seconds
energia-prod-mssql-1      0.0.0.0:14332->1433/tcp   Up 27 seconds (healthy)
energia-staging-api-1     0.0.0.0:8081->8080/tcp    Up 55 seconds
energia-staging-mssql-1   0.0.0.0:14331->1433/tcp   Up About a minute (healthy)

$ curl -s localhost:8081/health
{"status":"ok","ambiente":"Staging","versao":"local"}

$ curl -s localhost:8082/health
{"status":"ok","ambiente":"Production","versao":"local"}
```

O campo `ambiente` mostra qual instância respondeu.

### Smoke test do deploy

```
$ bash scripts/smoke-test.sh http://localhost:8081
==> Aguardando http://localhost:8081/health (timeout 180s)
    API respondeu em 0s
==> 1/4 GET /health
{"status":"ok","ambiente":"Staging","versao":"local"}
==> 2/4 POST /api/auth/login
    token obtido (349 caracteres)
==> 3/4 GET /api/consumos (prova que a API alcanca o banco)
    ok
==> 4/4 GET /api/alertas (prova que o JWT funciona)
    ok
==> SMOKE TEST PASSOU em http://localhost:8081
```

A saída completa, com os dois ambientes e os testes, está em
[`docs/evidencias-locais.txt`](docs/evidencias-locais.txt).

Para reproduzir na sua máquina:

```bash
docker compose --env-file .env.staging    -p energia-staging up -d --build
docker compose --env-file .env.production -p energia-prod    up -d --build
curl -s localhost:8081/health
curl -s localhost:8082/health
```

## Tecnologias utilizadas

Aplicação:

- ASP.NET Core 8 Web API, organizada em MVVM (Models, ViewModels, Services, Controllers)
- Entity Framework Core 8 com migrations
- SQL Server, na imagem Azure SQL Edge dentro do container
- Autenticação e autorização com JWT, via `Microsoft.AspNetCore.Authentication.JwtBearer`
- Swagger e OpenAPI com Swashbuckle
- React, Vite e TypeScript no frontend

Testes:

- xUnit com `Microsoft.AspNetCore.Mvc.Testing` para os testes de integração
- EF Core InMemory como banco de teste
- Bash e curl no smoke test de deploy
- Postman, com a coleção manual em `postman/`

DevOps:

- Docker, com build em dois estágios
- Docker Compose, usando volume, rede e variáveis de ambiente
- GitHub Actions, com GitHub Environments e aprovação manual em produção
- GitHub Container Registry como registro de imagens
- Cache de build do Actions (`type=gha`) e `docker/build-push-action`

## Endpoints da API

| Método | Rota | Descrição | Protegido |
|--------|------|-----------|-----------|
| POST | `/api/auth/login` | Autentica e devolve o token JWT | Não |
| GET | `/api/consumos?page=&pageSize=` | Lista paginada de consumos | Não |
| POST | `/api/leituras` | Registra leitura e dispara alerta automático | Sim (JWT) |
| GET | `/api/relatorios/equipamento/{id}` | Relatório agregado por equipamento | Não |
| GET | `/api/alertas?page=&pageSize=` | Lista paginada de alertas | Sim (JWT) |
| GET | `/health` | Status e ambiente da instância, usado pelo pipeline | Não |

Credenciais de demonstração: `admin` / `123456`.

## Estrutura do projeto

```
EnergiaApi/
├─ .github/workflows/ci-cd.yml   Pipeline de build, teste e deploy
├─ EnergiaApi.Api/               API (Models, ViewModels, Data, Services, Controllers, Migrations)
│  └─ Dockerfile                 Imagem da aplicação, em dois estágios
├─ EnergiaApi.Tests/             Testes de integração com xUnit
├─ frontend/                     Aplicação React (Vite e TypeScript)
├─ postman/                      Coleção e environment do Postman
├─ scripts/smoke-test.sh         Validação de cada deploy
├─ docs/                         Documentação técnica em PDF e evidências de execução
├─ docker-compose.yml            Orquestração da API com o SQL Server
├─ .env.example                  Modelo de variáveis para rodar local
├─ .env.staging                  Variáveis do ambiente de homologação
├─ .env.production               Variáveis do ambiente de produção
└─ README.md
```

## Rodando sem Docker

```bash
dotnet test                             # roda os 6 testes
dotnet run --project EnergiaApi.Api     # usa a connection string do appsettings.json
```

O `appsettings.json` aponta para o SQL Server LocalDB, que vem com o Visual Studio no Windows. No Mac ou
Linux não existe LocalDB, então suba só o banco pelo Compose e aponte a connection string para ele:

```bash
docker compose up mssql -d
ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=EnergiaDb;User Id=sa;Password=Energia@2026!;TrustServerCertificate=True" \
  dotnet run --project EnergiaApi.Api
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A URL da API fica em `frontend/.env`, na variável `VITE_API_URL`.

### Postman

Importe os dois arquivos de `postman/` e rode a requisição **Auth - Login** primeiro. O token é salvo na
variável `token` e reaproveitado nas requisições protegidas.

## Checklist de entrega

| Item | OK |
|------|----|
| Projeto compactado em .ZIP com estrutura organizada | Sim |
| Dockerfile funcional | Sim |
| docker-compose.yml ou arquivos Kubernetes | Sim |
| Pipeline com etapas de build, teste e deploy | Sim |
| README.md com instruções e prints | Sim |
| Documentação técnica com evidências (PDF ou PPT) | Sim |
| Deploy realizado nos ambientes staging e produção | Sim |

## Requisitos da aplicação, dos desafios anteriores

| Requisito | Onde está |
|-----------|-----------|
| 4 ou mais endpoints RESTful | 5 endpoints de negócio, mais o `/health` |
| MVVM | `Models`, `ViewModels`, `Services`, `Controllers` |
| Paginação | `ConsumosController` e `AlertasController`, com `Skip` e `Take` |
| Autenticação e autorização | JWT com `[Authorize]` |
| Validação | Data Annotations e `[ApiController]` |
| Tratamento global de exceções | `UseExceptionHandler` no `Program.cs` |
| Banco com migrations | EF Core e a pasta `Migrations/` |
| Otimização de consulta | `AsNoTracking`, índice composto, projeção, `Skip` e `Take` |
| Testes xUnit | `EnergiaApi.Tests`, 6 testes |
| Containerização | `EnergiaApi.Api/Dockerfile` e `docker-compose.yml` |
| CI/CD | `.github/workflows/ci-cd.yml` |
| Coleção Postman | `postman/EnergiaApi.postman_collection.json` |
