# FINANCE — Painel financeiro pessoal

Aplicativo financeiro pessoal com identidade visual **3D + Cinematic UI + Premium Dashboard**.
Frontend em **JavaScript (React + Vite + three.js)** e backend em **C# (.NET 10) + PostgreSQL**.

![stack](https://img.shields.io/badge/frontend-React%20%2B%20Vite%20%2B%20three.js-149eca) ![api](https://img.shields.io/badge/backend-ASP.NET%20Core%20net10.0-512bd4) ![db](https://img.shields.io/badge/banco-PostgreSQL%2018-336791) ![auth](https://img.shields.io/badge/auth-JWT%20%2B%20PBKDF2-d4af37)

> O registro cronológico completo do desenvolvimento está em [HISTORY.md](HISTORY.md).

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

## Como executar

### Atalho (produção local — recomendado)
1. `dotnet publish api -c Release -o publish` (após `npm run build` + copiar `dist/` para `api/wwwroot/`)
2. Duplo clique em **FINANCE** na área de trabalho (atalho criado para `scripts/FINANCE.bat`)
   - sobe o PostgreSQL do app (porta 5433), cria o banco na 1ª execução,
     inicia a API publicada (porta 5280) e abre o navegador

### Desenvolvimento
```bash
# 1) PostgreSQL do app (cluster local em pgdata/, porta 5433)
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D pgdata -l pgdata/logfile.log -o "-p 5433" start

# 2) API
cd api && dotnet ef database update && dotnet run   # http://localhost:5280

# 3) Frontend
npm install && npm run dev                          # http://localhost:5173 (proxy /api)
```

Conta de demonstração: botão **"Entrar com conta demo"** na tela de login
(criada pelo servidor com ~9 meses de histórico determinístico).

## Estrutura

```
finance-app/
├── api/                 backend C# (Entities, Data, Auth, Services, Controllers, Migrations)
├── src/                 frontend React (components, pages, context, hooks, services, styles)
├── scripts/             FINANCE.bat (launcher), make-icon.ps1, finance.ico
├── pgdata/              cluster PostgreSQL do app (gitignored)
├── publish/             saída do dotnet publish (gitignored)
└── HISTORY.md           registro cronológico completo do desenvolvimento
```
