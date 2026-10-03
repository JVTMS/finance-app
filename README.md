# FINANCE — Aplicativo financeiro pessoal de desktop

Aplicativo **desktop** para Windows com identidade visual **3D + Cinematic UI + Premium Dashboard**.
Janela nativa (WPF + WebView2), frontend em **JavaScript (React + Vite + three.js)**,
backend **C# (.NET 10)** e **PostgreSQL 18 embutido** — portátil: copie a pasta para
qualquer computador e execute, nada é instalado.

![stack](https://img.shields.io/badge/desktop-WPF%20%2B%20WebView2-512bd4) ![frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite%20%2B%20three.js-149eca) ![api](https://img.shields.io/badge/api-ASP.NET%20Core%20net10.0%20(in%2Dprocess)-5c2d91) ![db](https://img.shields.io/badge/banco-PostgreSQL%2018%20embutido-336791)

> O registro cronológico completo do desenvolvimento está em [HISTORY.md](HISTORY.md).

## Como usar (usuário final)

1. Copie a pasta `publish-app/` para o computador (ou pendrive).
2. Duplo clique em **FINANCE** (atalho do Desktop ou `FINANCE.bat` dentro da pasta).
3. Na primeira execução o banco de dados local é criado automaticamente (~5 s).
4. Entre com a **conta demo** (um clique) ou crie sua conta — os dados ficam na pasta.

Requisito único: **WebView2 Runtime** (pré-instalado no Windows 11 e em praticamente
todo Windows 10 atualizado; se faltar, a própria janela mostra o link para baixar).

## Arquitetura

```
┌────────────────────────── Finance.App.exe (janela nativa) ─────────────────────────┐
│  WebView2 (interface React)  ←→  ASP.NET Core in-process (Controllers REST + JWT)  │
└──────────────────────────────────────┬─────────────────────────────────────────────┘
                                       │ Npgsql (localhost:5433, trust local)
                          ┌────────────▼─────────────┐
                          │ PostgreSQL 18 embutido   │  cluster em data/pgdata
                          └──────────────────────────┘
FINANCE.bat (atalho): sobe o Postgres → abre a janela → ao fechar, encerra o Postgres.
Dev: Vite 5173 (proxy /api) + dotnet run em api/ (porta 5280).
```

- Toda rota da API é `[Authorize]` com scoping pelo `userId` do token — o cliente nunca envia userId confiável
- Senhas com **PBKDF2** (SHA-256, 100k iterações, salt por usuário, comparação em tempo constante)
- Chave de assinatura JWT **nunca versionada**: user-secrets no dev; `.local/jwt.key` gerada no 1º start
- Migrações EF Core versionadas em `api/Migrations`; `Database.Migrate()` no boot

## Funcionalidades

- **Entrada cinematográfica** (~1s): fundo escuro → luz ambiente → blur-to-sharp
- **Fundo 3D real** (three.js): partículas, geometrias metálicas, linhas de luz, parallax no mouse
- **Saldo hero** com objeto 3D reativo e flash animado quando dinheiro entra ou sai
- **Cards flutuantes** com tilt 3D, brilho seguindo o cursor, contador animado e sparklines
- **PATRIMÔNIO**: evolução consolidada (contas + investimentos) com tooltip de data/valor/variação
- **Visão Financeira**: insights calculados dos dados reais (nunca inventados)
- **Transações**: receitas, despesas, transferências e investimentos num modal único
- **Pesquisa global (Ctrl+K)** com parsing semântico: "despesas acima de 300", "agosto", "netflix"
- **Contas** com cartões de identidade própria; **Investimentos** com visualização 3D por classe
- **Relatórios mensais** com comparação e exportação **PDF / CSV / Excel**
- **7 temas + tema personalizado**, Cinematic Mode, Performance Mode, som opcional (OFF por padrão)
- **Responsivo**: desktop → celular (tab bar inferior), gráficos adaptativos

## Arquitetura

```
Navegador ── http://localhost:5280 ──► Kestrel (ASP.NET Core, net10.0)
                                        ├─ /api/**  → Controllers REST + JWT Bearer
                                        ├─ PostgreSQL 18 (EF Core / Npgsql, porta 5433)
                                        └─ wwwroot  → SPA React (build Vite)
Dev: Vite 5173 com proxy /api → 5280 · dotnet run em api/
```

- Toda rota da API é `[Authorize]` com scoping pelo `userId` do token — o cliente nunca envia userId confiável
- Senhas com **PBKDF2** (SHA-256, 100k iterações, salt por usuário, comparação em tempo constante)
- Chave de assinatura JWT **nunca versionada**: user-secrets no dev; `.local/jwt.key` gerada no 1º start
- Migrações EF Core versionadas em `api/Migrations`; `Database.Migrate()` no boot

## Endpoints principais

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/auth/register` | cria conta (gera dados padrão) e emite JWT |
| POST | `/api/auth/login` | autentica |
| POST | `/api/auth/demo` | conta demo com seed determinístico (sem senha) |
| GET | `/api/auth/me` | perfil do token |
| DELETE | `/api/auth/data` | apaga todos os dados do usuário |
| GET | `/api/overview` | contas + transações + investimentos + categorias + notificações |
| GET/POST/PUT/DELETE | `/api/accounts` | CRUD de contas |
| GET/POST/DELETE | `/api/transactions` | movimentações (side-effects de aporte inclusos) |
| GET/POST/PATCH/DELETE | `/api/investments` | CRUD + `PATCH /{id}/value` |
| GET | `/api/preferences` · PUT `/{key}` | preferências (tema, modos, som) |
| GET | `/health` | health check do launcher |

## Como executar (desenvolvimento)

```bash
# 1) PostgreSQL do app (cluster local em pgdata/, porta 5433)
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D pgdata -l pgdata/logfile.log -o "-p 5433" start

# 2) API standalone
cd api && dotnet ef database update && dotnet run   # http://localhost:5280

# 3) Frontend (hot reload)
npm install && npm run dev                          # http://localhost:5173 (proxy /api)

# Janela de desktop em dev:
cd app && dotnet run                                # abre a janela nativa
```

## Como gerar a pasta portátil

```bash
npm run build && rm -rf api/wwwroot && cp -r dist api/wwwroot
dotnet publish app -c Release -r win-x64 --self-contained true -o publish-app
cp -r dist publish-app/wwwroot
cp -r "C:\Program Files\PostgreSQL\18\bin" "C:\Program Files\PostgreSQL\18\lib" \
      "C:\Program Files\PostgreSQL\18\share" publish-app/postgres/
cp "C:\Program Files\PostgreSQL\18\installer\vcredist_x64.exe" publish-app/installers/ 2>/dev/null
cp scripts/FINANCE.bat scripts/finance.ico publish-app/
```

Conta de demonstração: botão **"Entrar com conta demo"** na tela de login
(criada pelo servidor com ~9 meses de histórico determinístico).

## Estrutura

```
finance-app/
├── api/                 backend C# (Entities, Data, Auth, Services, Controllers, Migrations)
├── app/                 shell de desktop WPF + WebView2 (janela nativa, API in-process)
├── src/                 frontend React (components, pages, context, hooks, services, styles)
├── scripts/             FINANCE.bat, make-icon.ps1, check-crash.ps1, finance.ico
├── pgdata/              cluster PostgreSQL usado em dev (gitignored)
├── publish-app/         PASTA PORTÁTIL final (gitignored): copie e execute
└── HISTORY.md           registro cronológico completo do desenvolvimento
```
