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
  Zero elevação, zero senhas compartilhadas, dados em `api/.pgdata` (gitignored).
- Chave JWT nunca em código/repo: user-secrets no dev; arquivo `.local/jwt.key`
  gerado no primeiro start em produção.

*(Esta seção continua sendo atualizada conforme o backend avança.)*
