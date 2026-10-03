using System.Security.Claims;
using Finance.Api.Auth;
using Finance.Api.Data;
using Finance.Api.Entities;
using Finance.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Finance.Api.Controllers;

public record AuthRequest(string? Name, string Email, string Password);
public record AuthResponse(int UserId, string Name, string Email, string Token);

[ApiController]
[Route("api/auth")]
public class AuthController(
    FinanceDbContext db,
    TokenService tokens,
    SeedDemoService demoSeed
) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(AuthRequest req, CancellationToken ct)
    {
        var name = req.Name?.Trim();
        var email = req.Email?.Trim().ToLowerInvariant();

        if (string.IsNullOrEmpty(name)) return BadRequest("Informe seu nome.");
        if (string.IsNullOrEmpty(email) || !System.Text.RegularExpressions.Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
            return BadRequest("Informe um e-mail válido.");
        if (string.IsNullOrEmpty(req.Password) || req.Password.Length < 6)
            return BadRequest("A senha precisa ter pelo menos 6 caracteres.");
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            return Conflict("Já existe uma conta com este e-mail.");

        var user = new User
        {
            Name = name,
            Email = email,
            PasswordHash = PasswordHasher.Hash(req.Password),
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        SeedDefaults(user.Id);
        await db.SaveChangesAsync(ct);

        return Ok(new AuthResponse(user.Id, user.Name, user.Email, tokens.Issue(user)));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(AuthRequest req, CancellationToken ct)
    {
        var email = req.Email?.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null || !PasswordHasher.Verify(req.Password ?? "", user.PasswordHash))
            return Unauthorized("E-mail ou senha incorretos.");
        return Ok(new AuthResponse(user.Id, user.Name, user.Email, tokens.Issue(user)));
    }

    /// <summary>Acesso dedicado à conta de demonstração (dados fictícios, sem senha).</summary>
    [HttpPost("demo")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Demo(CancellationToken ct)
    {
        var user = await demoSeed.EnsureDemoUserAsync(ct);
        return Ok(new AuthResponse(user.Id, user.Name, user.Email, tokens.Issue(user)));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> Me(CancellationToken ct)
    {
        var userId = CurrentUserId();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return Unauthorized();
        return Ok(new AuthResponse(user.Id, user.Name, user.Email, ""));
    }

    /// <summary>Apaga todos os dados do usuário autenticado (mantém o cadastro).</summary>
    [HttpDelete("data")]
    [Authorize]
    public async Task<IActionResult> WipeData(CancellationToken ct)
    {
        var userId = CurrentUserId();
        await db.Transactions.Where(t => t.UserId == userId).ExecuteDeleteAsync(ct);
        await db.Investments.Where(i => i.UserId == userId).ExecuteDeleteAsync(ct);
        await db.Accounts.Where(a => a.UserId == userId).ExecuteDeleteAsync(ct);
        await db.Categories.Where(c => c.UserId == userId).ExecuteDeleteAsync(ct);
        await db.Notifications.Where(n => n.UserId == userId).ExecuteDeleteAsync(ct);
        await db.Preferences.Where(p => p.UserId == userId).ExecuteDeleteAsync(ct);
        return NoContent();
    }

    private int CurrentUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0", System.Globalization.CultureInfo.InvariantCulture);

    private void SeedDefaults(int userId)
    {
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
        foreach (var c in cats)
            db.Categories.Add(new Category { UserId = userId, Kind = c.kind, Name = c.name, Icon = c.icon, Color = c.color });

        db.Accounts.Add(new Account { UserId = userId, Name = "Conta principal", Institution = "Meu banco", Type = "conta", Color = "#7c8ba1", InitialBalance = 0 });
    }
}
