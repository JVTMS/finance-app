using System.Security.Claims;
using System.Text.Json;
using Finance.Api.Data;
using Finance.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Finance.Api.Controllers;

/// <summary>
/// Preferências por usuário (tema, cinematic, performance, som, tema custom).
/// Valores são JSON arbitrário; a leitura devolve o mapa completo {chave: valor}.
/// </summary>
[ApiController]
[Route("api/preferences")]
[Authorize]
public class PreferencesController(FinanceDbContext db) : ControllerBase
{
    private int CurrentUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0", System.Globalization.CultureInfo.InvariantCulture);

    [HttpGet]
    public async Task<ActionResult<Dictionary<string, object?>>> GetAll(CancellationToken ct)
    {
        var rows = await db.Preferences.AsNoTracking()
            .Where(p => p.UserId == CurrentUserId())
            .ToListAsync(ct);
        return Ok(rows.ToDictionary(p => p.Key, p => JsonDocument.Parse(p.Value).RootElement.Clone()));
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> Set(string key, [FromBody] JsonElement body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(key) || key.Length > 60) return BadRequest("Chave inválida.");
        var userId = CurrentUserId();
        var value = body.GetRawText();

        var existing = await db.Preferences.FirstOrDefaultAsync(p => p.UserId == userId && p.Key == key, ct);
        if (existing is null)
            db.Preferences.Add(new UserPreference { UserId = userId, Key = key, Value = value });
        else
            existing.Value = value;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
