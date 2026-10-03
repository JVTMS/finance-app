using System.Security.Cryptography;
using Finance.Api.Data;
using Finance.Api.Entities;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Finance.Api.Auth;

public class TokenService(IConfiguration config)
{
    /// <summary>Emiti um JWT assinado com a chave resolvida no Program.cs.</summary>
    public string Issue(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtKeyProvider.Key));
        var days = config.GetValue<int?>("Jwt:ExpiresDays") ?? 30;
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.Name),
        };
        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims,
            expires: DateTime.UtcNow.AddDays(days),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

/// <summary>
/// Chave de assinatura do JWT, resolvida UMA vez por processo:
/// 1) user-secrets / variável Jwt:Key (desenvolvimento);
/// 2) arquivo .local/jwt.key gerado no primeiro start (produção local).
/// Nunca versionada.
/// </summary>
public static class JwtKeyProvider
{
    public static string Key { get; private set; } = "";

    public static void InitializeFrom(string contentRoot)
    {
        if (Key.Length > 0) return;
        var dir = Path.Combine(contentRoot, ".local");
        Directory.CreateDirectory(dir);
        var file = Path.Combine(dir, "jwt.key");
        if (File.Exists(file) && File.ReadAllText(file).Trim().Length >= 32)
        {
            Key = File.ReadAllText(file).Trim();
            return;
        }
        var bytes = RandomNumberGenerator.GetBytes(64);
        Key = Convert.ToBase64String(bytes);
        File.WriteAllText(file, Key);
    }
}
