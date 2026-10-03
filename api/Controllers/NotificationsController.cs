using System.Security.Claims;
using Finance.Api.Data;
using Finance.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Finance.Api.Controllers;

public record NotificationRequest(string Type, string Title, string Message);

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController(FinanceDbContext db) : ControllerBase
{
    private int CurrentUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0", System.Globalization.CultureInfo.InvariantCulture);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Notification>>> GetAll(CancellationToken ct) =>
        Ok(await db.Notifications.AsNoTracking()
            .Where(n => n.UserId == CurrentUserId())
            .OrderByDescending(n => n.CreatedAt)
            .Take(40)
            .ToListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<Notification>> Create(NotificationRequest req, CancellationToken ct)
    {
        var n = new Notification
        {
            UserId = CurrentUserId(),
            Type = req.Type is "success" or "warn" or "error" or "info" ? req.Type : "info",
            Title = req.Title,
            Message = req.Message ?? "",
        };
        db.Notifications.Add(n);
        await db.SaveChangesAsync(ct);
        return Ok(n);
    }

    [HttpPost("mark-read")]
    public async Task<IActionResult> MarkRead(CancellationToken ct)
    {
        await db.Notifications
            .Where(n => n.UserId == CurrentUserId() && !n.Read)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.Read, true), ct);
        return NoContent();
    }
}
