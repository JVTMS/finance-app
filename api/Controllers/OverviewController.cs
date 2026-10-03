using System.Security.Claims;
using Finance.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Finance.Api.Controllers;

/// <summary>Carga inicial do app: contas + transações + investimentos + categorias + notificações.</summary>
[ApiController]
[Route("api/overview")]
[Authorize]
public class OverviewController(FinanceDbContext db) : ControllerBase
{
    private int CurrentUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0", System.Globalization.CultureInfo.InvariantCulture);

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var userId = CurrentUserId();
        var accounts = await db.Accounts.AsNoTracking()
            .Where(a => a.UserId == userId).OrderBy(a => a.Id).ToListAsync(ct);
        var transactions = await db.Transactions.AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.Date).ThenByDescending(t => t.CreatedAt)
            .ToListAsync(ct);
        var investments = await db.Investments.AsNoTracking()
            .Include(i => i.History.OrderBy(m => m.Date))
            .Where(i => i.UserId == userId)
            .OrderByDescending(i => i.StartedAt).ThenByDescending(i => i.Id)
            .ToListAsync(ct);
        var categories = await db.Categories.AsNoTracking()
            .Where(c => c.UserId == userId).OrderBy(c => c.Id).ToListAsync(ct);
        var notifications = await db.Notifications.AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt).ThenByDescending(n => n.Id)
            .Take(40).ToListAsync(ct);

        return Ok(new { accounts, transactions, investments, categories, notifications });
    }
}
