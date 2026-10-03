using System.Globalization;
using Finance.Api.Auth;
using Finance.Api.Data;
using Finance.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Finance.Api.Services;

/// <summary>
/// Cria a conta de demonstração com ~9 meses de histórico realista e determinístico.
/// Porta fiel de src/services/seed.js: a sequência de consumo do PRNG (mulberry32,
/// semente 20261003) é idêntica, então os dados gerados são os mesmos do app original.
/// A conta demo não tem senha: o acesso é feito por POST /api/auth/demo.
/// </summary>
public class SeedDemoService(FinanceDbContext db, ILogger<SeedDemoService> logger)
{
    public const string DemoEmail = "demo@finance.app";

    // ---- PRNG mulberry32 — mesma implementação do JS (uint já envolve módulo 2^32) ----
    private sealed class Mulberry32(uint seed)
    {
        private uint _a = seed;
        public double Next()
        {
            _a = _a + 0x6D2B79F5u;
            uint t = _a ^ (_a >> 15);
            t = t * (1u | _a);
            t = (t + ((t ^ (t >> 7)) * (61u | t))) ^ t;
            return (t ^ (t >> 14)) / 4294967296.0;
        }
    }

    private sealed class InvState
    {
        public required string Name { get; init; }
        public required string Type { get; init; }
        public required string Inst { get; init; }
        public required double Rate { get; init; }
        public required double Rate2 { get; init; }
        public required double Vol { get; init; }
        public required double Contribution { get; init; }
        public decimal Value;
        public decimal Invested;
        public List<InvestmentMark> Marks { get; } = [];
    }

    public async Task<User> EnsureDemoUserAsync(CancellationToken ct = default)
    {
        var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == DemoEmail, ct);
        if (existing != null) return existing;

        var rng = new Mulberry32(20261003u);
        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(DateTime.Today);

        var user = new User
        {
            Name = "Demonstração",
            Email = DemoEmail,
            // senha aleatória e descartada — o acesso demo é via POST /api/auth/demo
            PasswordHash = PasswordHasher.Hash(Convert.ToBase64String(Guid.NewGuid().ToByteArray())),
            CreatedAt = now,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // ---- Categorias (mesma ordem do DEFAULT_CATEGORIES do frontend) ----
        (string kind, string name, string icon, string color)[] cats =
        [
            ("receita", "Salário", "briefcase", "#34d399"),
            ("receita", "Freelance", "laptop", "#22d3ee"),
            ("receita", "Outras receitas", "plus-circle", "#a3e635"),
            ("despesa", "Moradia", "home", "#818cf8"),
            ("despesa", "Mercado", "shopping-cart", "#f472b6"),
            ("despesa", "Transporte", "car", "#60a5fa"),
            ("despesa", "Alimentação", "utensils", "#fb923c"),
            ("despesa", "Saúde", "heart-pulse", "#f87171"),
            ("despesa", "Educação", "graduation-cap", "#38bdf8"),
            ("despesa", "Lazer", "gamepad-2", "#c084fc"),
            ("despesa", "Assinaturas", "monitor-play", "#2dd4bf"),
            ("despesa", "Compras", "shopping-bag", "#e879f9"),
            ("despesa", "Outros", "circle-ellipsis", "#94a3b8"),
        ];
        var categories = cats.Select(c => new Category { UserId = user.Id, Kind = c.kind, Name = c.name, Icon = c.icon, Color = c.color }).ToList();
        db.Categories.AddRange(categories);

        var accNubank = new Account { UserId = user.Id, Name = "Nubank", Institution = "Nubank", Type = "conta", Color = "#8b5cf6", InitialBalance = 4200 };
        var accItau = new Account { UserId = user.Id, Name = "Itaú", Institution = "Itaú Unibanco", Type = "conta", Color = "#f97316", InitialBalance = 9800 };
        var accCarteira = new Account { UserId = user.Id, Name = "Carteira", Institution = "Dinheiro físico", Type = "carteira", Color = "#94a3b8", InitialBalance = 600 };
        db.Accounts.AddRange(accNubank, accItau, accCarteira);
        await db.SaveChangesAsync();

        int CatId(string name) => categories.First(c => c.Name == name).Id;

        var txList = new List<Transaction>();
        int txSeq = 0;
        void AddTx(Transaction tx)
        {
            if (tx.Date > today) return;
            tx.CreatedAt = now.AddSeconds(txSeq++);
            txList.Add(tx);
        }

        int Rint(int min, int max) => (int)Math.Floor(rng.Next() * (max - min + 1)) + min;   // 1 rng
        decimal RMoney(double min, double max) => (decimal)(Math.Round((min + rng.Next() * (max - min)) * 100) / 100); // 1 rng
        string Pick(params string[] arr) => arr[(int)Math.Floor(rng.Next() * arr.Length)];  // 1 rng

        var invState = new List<InvState>
        {
            new() { Name = "CDB Banco Inter 115% CDI", Type = "CDB", Inst = "Banco Inter", Rate = 0.0085, Rate2 = 0, Vol = 0, Contribution = 400 },
            new() { Name = "Tesouro IPCA+ 2035", Type = "Tesouro", Inst = "XP Investimentos", Rate = 0.008, Rate2 = 0, Vol = 0, Contribution = 300 },
            new() { Name = "ETF IVVB11 — S&P 500", Type = "ETF", Inst = "Rico Investimentos", Rate = 0.009, Rate2 = 0, Vol = 0.03, Contribution = 200 },
            new() { Name = "FII MXRF11", Type = "FII", Inst = "XP Investimentos", Rate = 0.0055, Rate2 = 0.0045, Vol = 0, Contribution = 100 },
        };

        foreach (var month in MonthsBetween(StartMonth, EndMonth))
        {
            var isCurrent = month == EndMonth;

            // ---- Entradas ----
            AddTx(new Transaction { UserId = user.Id, Type = "receita", Name = "Salário", Amount = 5800m, Date = DayISO(month, isCurrent ? 2 : 5), CategoryId = CatId("Salário"), AccountId = accNubank.Id, Description = "Salário mensal" });
            if (isCurrent || rng.Next() > 0.25)
            {
                AddTx(new Transaction
                {
                    UserId = user.Id, Type = "receita",
                    Name = Pick("Projeto de site", "Consultoria", "Design de marca", "Aula particular"),
                    Amount = RMoney(320, 1250),
                    Date = DayISO(month, isCurrent ? 1 : Rint(6, 26)),
                    CategoryId = CatId("Freelance"), AccountId = accNubank.Id,
                });
            }

            // ---- Saídas fixas ----
            if (!isCurrent)
            {
                AddTx(new Transaction { UserId = user.Id, Type = "despesa", Name = "Aluguel", Amount = 1900m, Date = DayISO(month, 10), CategoryId = CatId("Moradia"), AccountId = accItau.Id });
                AddTx(new Transaction { UserId = user.Id, Type = "transferencia", Name = "Transferência para Itaú", Amount = 2500m, Date = DayISO(month, 8), AccountId = accNubank.Id, ToAccountId = accItau.Id, Description = "Cobrir contas fixas" });
                AddTx(new Transaction { UserId = user.Id, Type = "despesa", Name = "Netflix", Amount = 49.9m, Date = DayISO(month, 15), CategoryId = CatId("Assinaturas"), AccountId = accNubank.Id });
                AddTx(new Transaction { UserId = user.Id, Type = "despesa", Name = "Spotify", Amount = 21.9m, Date = DayISO(month, 18), CategoryId = CatId("Assinaturas"), AccountId = accNubank.Id });
                AddTx(new Transaction { UserId = user.Id, Type = "transferencia", Name = "Saque para carteira", Amount = 300m, Date = DayISO(month, 6), AccountId = accNubank.Id, ToAccountId = accCarteira.Id });
            }

            // ---- Saídas variáveis ----
            int[] mercadoDays = isCurrent ? [1, 2] : [3, 10, 17, 24];
            foreach (var day in mercadoDays)
            {
                AddTx(new Transaction
                {
                    UserId = user.Id, Type = "despesa",
                    Name = Pick("Supermercado", "Feira livre", "Compras do mês", "Hortifruti"),
                    Amount = RMoney(140, 380),
                    Date = DayISO(month, day + Rint(0, 1)),
                    CategoryId = CatId("Mercado"), AccountId = accNubank.Id,
                });
            }

            int[] transporteDays = isCurrent ? [2] : [Rint(4, 12), Rint(14, 22), Rint(23, 27)];
            foreach (var day in transporteDays)
            {
                AddTx(new Transaction
                {
                    UserId = user.Id, Type = "despesa",
                    Name = Pick("Uber", "Combustível", "Ônibus", "Estacionamento"),
                    Amount = RMoney(28, 130),
                    Date = DayISO(month, day),
                    CategoryId = CatId("Transporte"),
                    AccountId = Rint(0, 1) == 0 ? accNubank.Id : accCarteira.Id,
                });
            }

            if (!isCurrent)
            {
                int foods = Rint(1, 3);
                for (int i = 0; i < foods; i++)
                {
                    AddTx(new Transaction
                    {
                        UserId = user.Id, Type = "despesa",
                        Name = Pick("Restaurante", "iFood", "Padaria", "Cafeteria"),
                        Amount = RMoney(24, 95),
                        Date = DayISO(month, Rint(2, 27)),
                        CategoryId = CatId("Alimentação"), AccountId = accNubank.Id,
                    });
                }
                if (rng.Next() < 0.35)
                    AddTx(new Transaction { UserId = user.Id, Type = "despesa", Name = Pick("Farmácia", "Consulta médica", "Exames"), Amount = RMoney(75, 260), Date = DayISO(month, Rint(5, 25)), CategoryId = CatId("Saúde"), AccountId = accNubank.Id });
                if (rng.Next() < 0.55)
                    AddTx(new Transaction { UserId = user.Id, Type = "despesa", Name = Pick("Cinema", "Bar com amigos", "Show", "Passeio de fim de semana"), Amount = RMoney(40, 160), Date = DayISO(month, Rint(8, 26)), CategoryId = CatId("Lazer"), AccountId = accNubank.Id });
                if (rng.Next() < 0.45)
                    AddTx(new Transaction { UserId = user.Id, Type = "despesa", Name = Pick("Loja de roupas", "Presente", "Casa e utilidades", "Eletrônico"), Amount = RMoney(60, 420), Date = DayISO(month, Rint(3, 27)), CategoryId = CatId("Compras"), AccountId = accNubank.Id });
                if (rng.Next() < 0.30)
                    AddTx(new Transaction { UserId = user.Id, Type = "despesa", Name = Pick("Curso online", "Livro", "Material de estudo"), Amount = RMoney(35, 180), Date = DayISO(month, Rint(5, 24)), CategoryId = CatId("Educação"), AccountId = accNubank.Id });

                // ---- Aportes (dia 20) ----
                foreach (var inv in invState)
                {
                    inv.Invested += (decimal)inv.Contribution;
                    inv.Value += (decimal)inv.Contribution;
                    AddTx(new Transaction { UserId = user.Id, Type = "investimento", Name = $"Aporte — {inv.Name}", Amount = (decimal)inv.Contribution, Date = DayISO(month, 20), AccountId = accItau.Id, Description = "Aporte mensal" });
                }
            }

            // ---- Marcação de valor fim do mês ----
            var lastDay = isCurrent ? today : MonthEnd(month);
            foreach (var inv in invState)
            {
                if (inv.Value <= 0) continue;
                var growth = inv.Rate + (inv.Vol > 0 ? (rng.Next() - 0.5) * 2 * inv.Vol : 0) + inv.Rate2;
                var factor = 1 + growth * (isCurrent ? 0.12 : 1);
                inv.Value = Math.Round(inv.Value * (decimal)factor * 100) / 100;
                inv.Marks.Add(new InvestmentMark { Date = lastDay, Value = inv.Value });
            }
        }

        // ---- Investimentos (ids primeiro, para ligar as transações) ----
        var invEntities = invState.Select(inv => new Investment
        {
            UserId = user.Id,
            Name = inv.Name,
            Type = inv.Type,
            Institution = inv.Inst,
            StartedAt = new DateOnly(2026, 2, 20),
            Invested = Math.Round(inv.Invested * 100) / 100,
            Current = inv.Value,
            History = inv.Marks,
        }).ToList();
        db.Investments.AddRange(invEntities);
        await db.SaveChangesAsync();

        // ---- Associa aportes aos investimentos por ordem de criação (como no seed.js) ----
        var invTxs = txList.Where(t => t.Type == "investimento").ToList();
        var perInv = Math.Max(1, invTxs.Count / invEntities.Count);
        for (int i = 0; i < invTxs.Count; i++)
        {
            var slot = Math.Min(i / perInv, invEntities.Count - 1);
            invTxs[i].InvestmentId = invEntities[slot].Id;
        }

        foreach (var tx in txList) db.Transactions.Add(tx);

        db.Notifications.AddRange(
            new Notification { UserId = user.Id, Type = "success", Title = "Rendimento creditado", Message = "CDB Banco Inter atualizado com rendimento mensal.", Read = true, CreatedAt = now.AddHours(-1) },
            new Notification { UserId = user.Id, Type = "success", Title = "Salário recebido", Message = "R$ 5.800,00 em Nubank.", Read = true, CreatedAt = now.AddDays(-2) },
            new Notification { UserId = user.Id, Type = "info", Title = "Relatório disponível", Message = "O relatório de setembro está pronto para exportar.", Read = true, CreatedAt = now.AddDays(-5) });

        await db.SaveChangesAsync();
        logger.LogInformation("Conta demo criada: {TxCount} transações, {InvCount} investimentos.", txList.Count, invEntities.Count);
        return user;
    }

    private static IEnumerable<string> MonthsBetween(string from, string to)
    {
        var (fy, fm) = ParseMonth(from);
        var (ty, tm) = ParseMonth(to);
        int y = fy, m = fm;
        while (y < ty || (y == ty && m <= tm))
        {
            yield return $"{y:D4}-{m:D2}";
            m++;
            if (m > 12) { m = 1; y++; }
        }
    }

    private static (int y, int m) ParseMonth(string key) =>
        (int.Parse(key[..4], CultureInfo.InvariantCulture), int.Parse(key[5..7], CultureInfo.InvariantCulture));

    private static DateOnly DayISO(string monthKey, int day)
    {
        var (y, m) = ParseMonth(monthKey);
        var last = DateTime.DaysInMonth(y, m);
        return new DateOnly(y, m, Math.Min(day, last));
    }

    private static DateOnly MonthEnd(string monthKey)
    {
        var (y, m) = ParseMonth(monthKey);
        return new DateOnly(y, m, DateTime.DaysInMonth(y, m));
    }

    private const string StartMonth = "2026-02";
    private const string EndMonth = "2026-10";
}
