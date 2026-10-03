using Finance.Api.Data;
using Finance.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Finance.Api.Services;

/// <summary>
/// Efeitos colaterais de aportes: registrar/remove valores em Invested/Current
/// e mantém o histórico de marcações — mesma semântica do api.js original.
/// </summary>
public class InvestmentService(FinanceDbContext db)
{
    public async Task ApplyAporteAsync(Transaction tx, int? investmentId, InvestmentSnapshot? newInvestment, CancellationToken ct)
    {
        if (tx.Type != "investimento") return;

        Investment? inv;
        if (investmentId is int id)
        {
            inv = await db.Investments.FirstOrDefaultAsync(i => i.Id == id && i.UserId == tx.UserId, ct)
                  ?? throw new InvalidOperationException("Investimento não encontrado.");
            inv.Invested = Math.Round(inv.Invested + tx.Amount, 2);
            inv.Current = Math.Round(inv.Current + tx.Amount, 2);
        }
        else
        {
            inv = new Investment
            {
                UserId = tx.UserId,
                Name = newInvestment?.Name is { Length: > 0 } n ? n : tx.Name,
                Type = newInvestment?.Type ?? "CDB",
                Institution = newInvestment?.Institution ?? "",
                Note = newInvestment?.Note ?? "",
                StartedAt = tx.Date,
                Invested = tx.Amount,
                Current = tx.Amount,
                History = [new InvestmentMark { Date = tx.Date, Value = tx.Amount }],
            };
            db.Investments.Add(inv);
            await db.SaveChangesAsync(ct); // precisa do Id para a FK da transação
        }
        tx.InvestmentId = inv.Id;
    }

    public async Task RevertAporteAsync(Transaction tx, CancellationToken ct)
    {
        if (tx.Type != "investimento" || tx.InvestmentId is not int id) return;
        var inv = await db.Investments.Include(i => i.History).FirstOrDefaultAsync(i => i.Id == id, ct);
        if (inv is null) return;
        inv.Invested = Math.Max(0, Math.Round(inv.Invested - tx.Amount, 2));
        inv.Current = Math.Max(0, Math.Round(inv.Current - tx.Amount, 2));
    }

    public async Task<Investment?> UpdateMarketValueAsync(int userId, int id, decimal value, CancellationToken ct)
    {
        var inv = await db.Investments.Include(i => i.History).FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId, ct);
        if (inv is null) return null;
        inv.Current = Math.Round(value, 2);
        inv.History.Add(new InvestmentMark { InvestmentId = inv.Id, Date = DateOnly.FromDateTime(DateTime.Today), Value = inv.Current });
        var excess = inv.History.Count - 80;
        if (excess > 0) inv.History.RemoveRange(0, excess);
        await db.SaveChangesAsync(ct);
        return inv;
    }
}

public record InvestmentSnapshot(string Name, string Type, string Institution, string Note);
