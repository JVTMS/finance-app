using System.Security.Claims;
using Finance.Api.Data;
using Finance.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Finance.Api.Controllers;

public record AccountRequest(string Name, string Institution, string Type, string Color, decimal InitialBalance);

[ApiController]
[Route("api/accounts")]
[Authorize]
public class AccountsController(FinanceDbContext db) : ControllerBase
{
    private int CurrentUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0", System.Globalization.CultureInfo.InvariantCulture);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Account>>> GetAll(CancellationToken ct) =>
        Ok(await db.Accounts.AsNoTracking().Where(a => a.UserId == CurrentUserId()).OrderBy(a => a.Id).ToListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<Account>> Create(AccountRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Dê um nome à conta.");
        var account = new Account
        {
            UserId = CurrentUserId(),
            Name = req.Name.Trim(),
            Institution = (req.Institution ?? "").Trim(),
            Type = string.IsNullOrWhiteSpace(req.Type) ? "conta" : req.Type,
            Color = string.IsNullOrWhiteSpace(req.Color) ? "#7c8ba1" : req.Color,
            InitialBalance = req.InitialBalance,
        };
        db.Accounts.Add(account);
        await db.SaveChangesAsync(ct);
        return Ok(account);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<Account>> Update(int id, AccountRequest req, CancellationToken ct)
    {
        var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == CurrentUserId(), ct);
        if (account is null) return NotFound();
        account.Name = req.Name.Trim();
        account.Institution = (req.Institution ?? "").Trim();
        account.Type = req.Type;
        account.Color = req.Color;
        account.InitialBalance = req.InitialBalance;
        await db.SaveChangesAsync(ct);
        return Ok(account);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var userId = CurrentUserId();
        var linked = await db.Transactions.CountAsync(t => t.UserId == userId && (t.AccountId == id || t.ToAccountId == id), ct);
        if (linked > 0)
            return Conflict(new { error = $"Esta conta possui {linked} movimentação(ões). Exclua ou mova o histórico antes." });

        var account = await db.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, ct);
        if (account is null) return NotFound();
        db.Accounts.Remove(account);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
