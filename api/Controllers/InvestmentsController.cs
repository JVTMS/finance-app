using System.Security.Claims;
using Finance.Api.Data;
using Finance.Api.Entities;
using Finance.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Finance.Api.Controllers;

public record InvestmentRequest(string Name, string Type, string Institution, string Note, DateOnly StartedAt, decimal InitialAmount);
public record InvestmentValueRequest(decimal Value);

[ApiController]
[Route("api/investments")]
[Authorize]
public class InvestmentsController(FinanceDbContext db, InvestmentService service) : ControllerBase
{
    private int CurrentUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0", System.Globalization.CultureInfo.InvariantCulture);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Investment>>> GetAll(CancellationToken ct) =>
        Ok(await db.Investments.AsNoTracking()
            .Include(i => i.History.OrderBy(m => m.Date))
            .Where(i => i.UserId == CurrentUserId())
            .OrderByDescending(i => i.StartedAt)
            .ToListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<Investment>> Create(InvestmentRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Dê um nome ao investimento.");
        var initial = Math.Round(req.InitialAmount, 2);
        var inv = new Investment
        {
            UserId = CurrentUserId(),
            Name = req.Name.Trim(),
            Type = string.IsNullOrWhiteSpace(req.Type) ? "CDB" : req.Type,
            Institution = (req.Institution ?? "").Trim(),
            Note = (req.Note ?? "").Trim(),
            StartedAt = req.StartedAt,
            Invested = initial,
            Current = initial,
            History = initial > 0
                ? [new InvestmentMark { Date = req.StartedAt, Value = initial }]
                : [],
        };
        db.Investments.Add(inv);
        await db.SaveChangesAsync(ct);
        return Ok(inv);
    }

    [HttpPatch("{id:int}/value")]
    public async Task<IActionResult> UpdateValue(int id, InvestmentValueRequest req, CancellationToken ct)
    {
        if (req.Value < 0) return BadRequest("O valor não pode ser negativo.");
        var inv = await service.UpdateMarketValueAsync(CurrentUserId(), id, req.Value, ct);
        if (inv is null) return NotFound();
        return Ok(inv);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var inv = await db.Investments.FirstOrDefaultAsync(i => i.Id == id && i.UserId == CurrentUserId(), ct);
        if (inv is null) return NotFound();
        db.Investments.Remove(inv);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
