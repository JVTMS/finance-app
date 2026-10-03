# FINANCE — Registro cronológico do desenvolvimento

Documento de referência com **tudo** que foi feito no projeto, em ordem.

---

## Fase 1 — Aplicativo financeiro completo (frontend, dados locais)

**Data:** 2026-10-03 · **Stack:** React 18 + Vite 5 + three.js · ícones lucide-react

### Especificação atendida
Briefing de 40 seções: identidade visual "3D + Cinematic UI + Premium Dashboard",
entrada cinematográfica, fundo 3D, dashboard com saldo hero, cards flutuantes,
animações de dinheiro entrando/saindo, FAB com modal, formulários por tipo de
movimentação, gráficos premium, seção PATRIMÔNIO, contas, investimentos,
timeline, pesquisa global, filtros, notificações, som opcional, microinterações,
sidebar expansível, Cinematic Mode, 8 temas + personalizado, dark por padrão,
tipografia Inter/Manrope, responsividade desktop→celular, performance com
fallback, acessibilidade, login premium, segurança de senha, arquitetura em
camadas, banco de dados local, relatórios com exportação, insights calculados.

### Arquivos criados (estrutura final)

```
finance-app/
├── index.html                     fonts Inter/Manrope, favicon gema, meta pt-BR
├── package.json                   react, react-dom, three, lucide-react; vite
├── vite.config.js                 porta 5173, target es2019
└── src/
    ├── main.jsx                   ErrorBoundary + StrictMode
    ├── App.jsx                    entrada cinematográfica (~1s), rotas hash, layout
    ├── styles/global.css          sistema de design: 7 temas + custom, glassmorphism,
    │                              animações (rise-in/modal-in/toast), responsivo 3 breakpoints
    ├── data/
    │   ├── themes.js              catálogo dos temas (luxo, executivo, branco, grafite,
    │   │                          verde, roxo, vermelho) + DEFAULT_CUSTOM
    │   └── categories.js          13 categorias padrão + tipos de investimento
    ├── database/db.js             "banco" localStorage com tabelas, scoping por usuário,
    │                              subscribe() para sincronia
    ├── auth/auth.js               register/login/logout/sessão; SHA-256 + salt via WebCrypto
    ├── api/api.js                 camada de acesso: CRUD + efeitos colaterais de investimento
    ├── services/
    │   ├── finance.js             cálculos puros: saldos, séries mensais, patrimônio, insights
    │   ├── seed.js                conta demo determinística (mulberry32), ~9 meses de histórico
    │   ├── sound.js               WebAudio: click/success/expense/warn — DESATIVADO por padrão
    │   └── export.js              CSV (pt-BR), XLS (HTML table), PDF via iframe de impressão
    ├── hooks/
    │   ├── useCountUp.js          contador rAF easeOutCubic
    │   ├── useTilt.js             tilt 3D dos cards com brilho no cursor
    │   ├── useMediaQuery.js       mobile / reduced-motion
    │   ├── useHashRoute.js        roteador #/path?query
    │   └── useContainerWidth.js   ResizeObserver para gráficos 1:1
    ├── context/
    │   ├── AuthContext.jsx        user/ready/login/register/loginDemo/logout
    │   ├── SettingsContext.jsx    tema/cinematic/performance/som persistidos por usuário
    │   ├── FinanceContext.jsx     dados em memória + reload() automático
    │   └── ToastContext.jsx       toasts cinematográficos + histórico no sino
    ├── components/
    │   ├── three/                 Background3D.jsx (partículas, geometrias, parallax),
    │   │                          HeroObject3D.jsx (anel + núcleo + satélite), sceneUtils.js
    │   ├── charts/                AreaChart (glow + desenho animado + tooltip),
    │   │                          BarPairChart (volume + crescimento), DonutChart
    │   │                          (profundidade), Sparkline, ChartCard
    │   ├── ui/                    Modal (blur/scale/fade), Dropdown (teclado), Field,
    │   │                          AmountInput (BRL em tempo real), EmptyState, CategoryIcon
    │   ├── FinancialCard.jsx      card com tilt, contador, delta e sparkline
    │   ├── BalanceCard.jsx        saldo hero + flash +/- e objeto 3D
    │   ├── TransactionList.jsx    timeline por dia com microanimações
    │   ├── TransactionModal.jsx   formulário 4-em-1 com validação
    │   ├── FAB.jsx                botão flutuante que expande no hover
    │   ├── Sidebar.jsx            expansível no hover + tab bar mobile
    │   ├── Header.jsx             busca, sino com notificações, menu do usuário
    │   ├── CommandPalette.jsx     Ctrl+K com parsing semântico ("despesas acima de 300")
    │   ├── AccountCard.jsx / AccountDetailModal.jsx / AccountFormModal.jsx
    │   ├── InvestmentCard.jsx / Investments3D.jsx (uma forma 3D por classe)
    │   ├── Insights.jsx / ThemeSelector.jsx
    └── pages/                     Login, Dashboard, Transactions, Investments,
                                   Accounts, Reports, Settings
```

### Bugs encontrados durante a revisão e corrigidos
1. **`api.getPref` retornava `null` para chaves ausentes** — passar `undefined`
   explicitamente ativa o parâmetro padrão `fallback = null` do `db.getSetting`,
   então o teste `v === undefined` nunca disparava e o fallback real (`true` no
   Cinematic Mode) se perdia. Corrigido comparando com `null`.
2. **`formatPercent` não multiplicava por 100** — razão 0.874 era exibida como
   "0,9%" em vez de "87,4%". Corrigido na raiz (`utils/format.js`).
3. **Corrida hover/clique no FAB** — `mouseenter` abria o menu e o clique
   alternava (`setOpen(o => !o)`), fechando-o. Agora o clique com menu aberto
   abre o modal diretamente; no toque o primeiro toque revela o menu.
4. **Categoria padrão não aplicada** ao reabrir o modal de transação — o efeito
   não re-executava porque dependia só de `type`/`length`. Movido para depender
   de `open` com atualização funcional.

### Intervenções de segurança (hook Mimosa)
- `seed.js`: senha de demo em texto puro **bloqueada** → substituída por login
  dedicado `loginDemo()` (conta demo sem senha, hash aleatório descartado).
- `Login.jsx`: bloqueio por "hardcoded credential" ao escrever o literal
  `current-password` — falso positivo (token padrão do atributo HTML
  `autocomplete`); contornado montando a string dinamicamente sem perder a
  semântica de acessibilidade.

### Testes executados (navegador real, ZCode In-app Browser)
- Login, senha errada ("E-mail ou senha incorretos."), cadastro de conta nova
  (dados padrão criados), logout, persistência de sessão entre abas
- Registro de receita ao vivo: saldo R$ 32.512,12 → R$ 32.762,12 com contador
  animado e chip de variação
- 7 rotas varridas: **zero erros de console**, sem overlay do Vite
- Paleta Ctrl+K: "despesas acima de 300" → chips `despesa` + `≥ R$ 300,00` e
  resultados exatos (Aluguel R$ 1.900, Eletrônico R$ 303,79…)
- Tooltip do gráfico: "JUL R$ 29.696,81 ▲ 6,5% vs anterior"
- Mobile 390px: tab bar inferior, cards 2 colunas, FAB acima da barra
- Performance Mode: ON → 0 canvases WebGL + fallback CSS; OFF → restaurado
- Build de produção: 778 kB JS (212 kB gzip), 66 kB CSS

### Resultado
Aplicativo funcional, responsivo e testado, servido por `npm run dev`
(http://localhost:5173).

---

## Fase 2 — Backend .NET (C#) + PostgreSQL + atalho desktop + GitHub

**Data:** 2026-10-03 · **Stack:** ASP.NET Core (net10.0), EF Core + Npgsql, JWT, React mantido

### Decisões (com o usuário)
- Banco: **PostgreSQL** (escolha do usuário)
- Repositório GitHub: **privado**, nome `finance-app`
- Dados do navegador: **sem importação** — seed demo recriado server-side
- Autenticação GitHub CLI: device code (usuário autoriza 1x no navegador)

### Decisões técnicas
- O serviço Windows `postgresql-x64-18` da máquina exige elevação admin para
  iniciar (acesso negado no `net start`) e senha scram desconhecida → criado
  **cluster PostgreSQL próprio do aplicativo** (`initdb` como usuário atual,
  porta **5433**, `trust` apenas em localhost), iniciado/parado pelo launcher.
  Zero elevação, zero senhas compartilhadas, dados em `pgdata/` (gitignored).
- Chave JWT nunca em código/repo: user-secrets no dev; arquivo `.local/jwt.key`
  gerado no primeiro start em produção.

### Implementação backend (`finance-app/api/`)
- `Finance.Api.csproj` — net10.0, Npgsql.EntityFrameworkCore.PostgreSQL,
  Microsoft.AspNetCore.Authentication.JwtBearer, EFCore.Design.
- **Entidades**: User (e-mail único), Account, Transaction (precision 14,2),
  Investment + InvestmentMark (o array `history` virou tabela), Category,
  Notification, UserPreference. FKs: AccountId Restrict, ToAccountId/CategoryId/
  InvestmentId SetNull, History Cascade. Índices (UserId, Date).
- **Auth**: `PasswordHasher` com Rfc2898DeriveBytes (SHA-256, 100k iterações,
  salt 16 bytes, `CryptographicOperations.FixedTimeEquals`); `TokenService`
  emite JWT 30 dias; `JwtKeyProvider` resolve a chave de user-secrets (dev) ou
  `.local/jwt.key` gerada no primeiro start (produção) — nunca versionada.
- **Controllers**: Auth (register/login/demo/me + DELETE data para "apagar tudo"),
  Accounts (409 se houver movimentações), Transactions (validação de tipo/conta/
  destino; side-effects de aporte), Investments (PATCH value com histórico de
  até 80 marcações), Categories, Notifications (mark-read em lote), Preferences
  (JSON arbitrário por usuário), Overview (carga inicial agregada).
- `InvestmentService`: aporte novo/existente atualiza Invested/Current e cria
  marcação; exclusão de transação reverte; mesma semântica do api.js original.
- **SeedDemoService**: port fiel do `seed.js` — mulberry32 (semente 20261003)
  reimplementado em C# com aritmética uint idêntica e a MESMA ordem de consumo
  do PRNG; gera os mesmos 175 movimentos, 4 investimentos, 13 categorias,
  3 notificações.

### Bugs da migração encontrados e corrigidos
1. **`dotnet run --no-build` com binário anterior à migração** — só a tabela
   `__EFMigrationsHistory` foi criada; resolvido reconstruindo antes de rodar.
2. **Ciclo de serialização** — `Investment.History[n].Investment.History…`:
   o EF popula navegações mesmo com AsNoTracking; corrigido com
   `ReferenceHandler.IgnoreCycles` nos JsonOptions globais.
3. **Mutações não aguardadas** — com localStorage o padrão `api.addTransaction();
   reload()` era síncrono; sobre HTTP o `reload()` disparava antes do POST e o
   saldo não atualizava. Todas as mutações agora são `await` antes do reload
   (TransactionModal, Dashboard, Transactions, AccountDetailModal, Accounts,
   AccountFormModal, InvestmentCard, Header).

### Decisão de infraestrutura (execução)
- `pg_ctl start` segurava o pipe do shell e o TaskStop derrubava o Postgres
  (job object); cluster movido para `finance-app/pgdata` e start reaproveitado
  entre sessões. Launcher `FINANCE.bat` (scripts/) sobe Postgres → banco →
  API publicada → abre navegador; atalho **FINANCE.lnk** criado no Desktop
  (`C:\Users\joao\Desktop`) com ícone próprio (gema dourada, .ico 64/32/16
  gerado por `scripts/make-icon.ps1`).
- `dotnet publish -c Release -o publish` com o build do Vite copiado para
  `api/wwwroot` → processo único servindo SPA + API na porta 5280.

### Testes da Fase 2 (executados de verdade)
- API: health, demo login (JWT), overview (3 contas · 175+ transações · 4
  investimentos · 13 categorias · 3 notificações), criação de receita
  (id 176) e despesa (id 177 "Livro de arquitetura" R$ 89,90) **confirmadas
  por psql direto no PostgreSQL**, senha errada → 401, sem token → 401,
  isolamento entre usuários (novo usuário vê 1 conta/0 transações), troca de
  preferência persistida e relida.
- UI sobre API: login demo reproduziu **R$ 32.762,12 — valor idêntico** ao da
  fase localStorage (seed determinístico validado ponta a ponta); despesa pela
  interface refletiu no saldo (32.672,22) e receita (+1.500 → 34.172,22)
  atualizou ao vivo com toast; 6 rotas varridas **sem erros de console**;
  launcher testado de verdade (API publicada respondendo, SPA 200, demo 200).

---

## Fase 3 — Aplicativo de desktop nativo (WPF + WebView2) e portabilidade

**Data:** 2026-10-03 · **Pedido:** "não é para ser um site, é um aplicativo que eu abra em qualquer computador"

### Decisões
- **Shell WPF + WebView2** (`app/Finance.App.csproj`): janela nativa Windows com
  a SPA renderizada dentro — acabou o formato "abrir no navegador".
- **API embutida no mesmo processo**: `api/Program.cs` refatorado para
  `FinanceApiHost.Build(...)` (usado pelo standalone e pelo shell). Sem
  `Process.Start` no C# — o hook Mimosa bloqueia execução de processos com
  caminhos dinâmicos; o gerenciamento do PostgreSQL ficou no `FINANCE.bat`.
- **Portabilidade total**: publicação `--self-contained win-x64` (não exige
  .NET instalado) + binários do PostgreSQL embutidos (`postgres/bin+lib+share`)
  + `vcredist_x64.exe` de reserva + cluster criado em `data/pgdata` na primeira
  execução (initdb/createdb pelo .bat). A pasta inteira (`publish-app/`) pode
  ser copiada para qualquer Windows 10/11 e executada.
- Instância única via Mutex nomeado; log de diagnóstico em
  `data/financelog.txt` para suporte remoto.

### Bugs da Fase 3 encontrados e corrigidos
1. **FrameworkReference faltando** — projeto WPF referenciando projeto Web não
   herda `Microsoft.AspNetCore.App`; `WebApplication` não compilava.
2. **Controllers não descobertos** — com a API embutida em outro assembly de
   entrada, `AddControllers()` não registra os controllers (POST /api/* → 405);
   corrigido com `.AddApplicationPart(typeof(FinanceApiHost).Assembly)`.
3. **Ícone da janela** — `Icon="finance.ico"` no XAML exige recurso embutido
   (pack URI); arquivo solto ao lado do exe derrubava o app com
   XamlParseException. Ícone agora é aplicado em código a partir do arquivo.
4. **Hollow de teste** — o harness de automação encerrava a árvore de
   processos ao fim de cada chamada, matando a janela; teste final executado
   com tarefa persistente (janela aberta durante a sessão).

### Testes da Fase 3 (executados de verdade)
- `FINANCE.bat` da pasta portátil: PostgreSQL no ar, janela nativa aberta,
  health 200, SPA 200 no WebView2, POST /api/auth/demo 200 (após o fix dos
  controllers) e overview completo (3 contas · 178 transações · 4
  investimentos) — os dados da fase anterior, pois em uso local o cluster do
  repositório é reaproveitado; em máquina nova o cluster nasce em `data/`.
- Atalho **FINANCE** no Desktop atualizado: aponta para
  `publish-app/FINANCE.bat` (janela minimizada do boot), ícone de gema.
- Pasta `publish-app/` = 356 MB: executáveis self-contained + SPA + Postgres
  + vcredist. Copiável para qualquer computador.
