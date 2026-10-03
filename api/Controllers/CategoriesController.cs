using System.Security.Claims;
using Finance.Api.Data;
using Finance.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Finance.Api.Controllers;

public record CategoryRequest(string Kind, string Name, string Icon, string Color);

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoriesController(FinanceDbContext db) : ControllerBase
{
    private int CurrentUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0", System.Globalization.CultureInfo.InvariantCulture);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetAll(CancellationToken ct) =>
        Ok(await db.Categories.AsNoTracking()
            .Where(c => c.UserId == CurrentUserId())
            .OrderBy(c => c.Id)
            .ToListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<Category>> Create(CategoryRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Dê um nome à categoria.");
        var cat = new Category
        {
            UserId = CurrentUserId(),
            Kind = req.Kind is "receita" or "despesa" ? req.Kind : "despesa",
            Name = req.Name.Trim(),
            Icon = string.IsNullOrWhiteSpace(req.Icon) ? "circle-ellipsis" : req.Icon,
            Color = string.IsNullOrWhiteSpace(req.Color) ? "#94a3b8" : req.Color,
        };
        db.Categories.Add(cat);
        await db.SaveChangesAsync(ct);
        return Ok(cat);
    }
}
