using System.Security.Claims;
using Finance.Api.Data;
using Finance.Api.Entities;
using Finance.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Finance.Api.Controllers;

public record TransactionRequest(
    string Type, string Name, decimal Amount, DateOnly Date,
    int? CategoryId, int AccountId, int? ToAccountId,
    string Description, int? InvestmentId, InvestmentSnapshot? Investment);

[ApiController]
[Route("api/transactions")]
[Authorize]
public class TransactionsController(FinanceDbContext db, InvestmentService investments) : ControllerBase
{
    private int CurrentUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0", System.Globalization.CultureInfo.InvariantCulture);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Transaction>>> GetAll(CancellationToken ct) =>
        Ok(await Query().ToListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<Transaction>> Create(TransactionRequest req, CancellationToken ct)
    {
        var userId = CurrentUserId();
        var amount = Math.Round(req.Amount, 2);
        if (amount <= 0) return BadRequest("Informe um valor maior que zero.");
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Dê um nome a esta movimentação.");

        var validTypes = new[] { "receita", "despesa", "transferencia", "investimento" };
        if (!validTypes.Contains(req.Type)) return BadRequest("Tipo inválido.");
        if (!await db.Accounts.AnyAsync(a => a.Id == req.AccountId && a.UserId == userId, ct))
            return BadRequest("Conta inválida.");
        if (req.Type == "transferencia" && (!req.ToAccountId.HasValue || req.ToAccountId == req.AccountId))
            return BadRequest("Selecione uma conta de destino diferente da origem.");
        if (req.Type == "transferencia" && !await db.Accounts.AnyAsync(a => a.Id == req.ToAccountId && a.UserId == userId, ct))
            return BadRequest("Conta de destino inválida.");
        if (req.CategoryId is int catId && !await db.Categories.AnyAsync(c => c.Id == catId && c.UserId == userId, ct))
            return BadRequest("Categoria inválida.");

        var tx = new Transaction
        {
            UserId = userId,
            Type = req.Type,
            Name = req.Name.Trim(),
            Amount = amount,
            Date = req.Date,
            CategoryId = req.Type is "receita" or "despesa" ? req.CategoryId : null,
            AccountId = req.AccountId,
            ToAccountId = req.Type == "transferencia" ? req.ToAccountId : null,
            Description = (req.Description ?? "").Trim(),
        };

        try
        {
            await investments.ApplyAporteAsync(tx, req.InvestmentId, req.Investment, ct);
        }
        catch (InvalidOperationException e)
        {
            return BadRequest(e.Message);
        }

        db.Transactions.Add(tx);
        await db.SaveChangesAsync(ct);
        return Ok(tx);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var userId = CurrentUserId();
        var tx = await db.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId, ct);
        if (tx is null) return NotFound();

        await investments.RevertAporteAsync(tx, ct);
        db.Transactions.Remove(tx);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private IOrderedQueryable<Transaction> Query() =>
        db.Transactions.AsNoTracking()
            .Where(t => t.UserId == CurrentUserId())
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt);
}
