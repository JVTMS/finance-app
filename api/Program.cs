using Finance.Api.Auth;
using Finance.Api.Data;
using Finance.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Finance.Api;

/// <summary>
/// Monta o host da API. Reutilizado por dois processos:
/// - execução standalone (dotnet run / Finance.Api.exe) via Program.Main;
/// - shell de desktop WPF (Finance.App), que embute a API no mesmo processo.
/// </summary>
public static class FinanceApiHost
{
    public static WebApplication Build(WebApplicationOptions options, string? connectionStringOverride = null, string? urls = null)
    {
        var builder = WebApplication.CreateBuilder(options);
        if (urls is not null) builder.WebHost.UseUrls(urls);

        // quando a API é embutida em outro processo (shell WPF), os controllers
        // precisam ser registrados explicitamente — o default é o assembly de entrada
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(FinanceApiHost).Assembly)
            .AddJsonOptions(o =>
        {
            // InvestmentMark.Investment ↔ Investment.History: o EF popula as navegações
            // mesmo com AsNoTracking; sem isso a serialização entra em ciclo.
            o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        });

        var connectionString = connectionStringOverride ?? builder.Configuration.GetConnectionString("Finance")
            ?? throw new InvalidOperationException("ConnectionStrings:Finance não configurada.");
        builder.Services.AddDbContext<FinanceDbContext>(o => o.UseNpgsql(connectionString));
        builder.Services.AddScoped<TokenService>();
        builder.Services.AddScoped<InvestmentService>();
        builder.Services.AddScoped<SeedDemoService>();

        var jwtKey = builder.Configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
        {
            // produção local: resolve (e cria, se necessário) a chave persistida em .local/jwt.key
            JwtKeyProvider.InitializeFrom(builder.Environment.ContentRootPath);
            jwtKey = JwtKeyProvider.Key;
        }

        builder.Services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(o =>
            {
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = builder.Configuration["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = builder.Configuration["Jwt:Audience"],
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                };
            });
        builder.Services.AddAuthorization();

        // CORS apenas para o dev (Vite na 5173)
        builder.Services.AddCors(o => o.AddPolicy("dev", p => p
            .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()));

        var app = builder.Build();

        // Aplica migrações pendentes antes de atender requisições
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
            db.Database.Migrate();
        }

        if (app.Environment.IsDevelopment())
        {
            app.UseCors("dev");
        }

        app.UseDefaultFiles();
        app.UseStaticFiles();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();

        // SPA fallback — rotas de hash (#/...) chegam como "/" e deep-links caem no index
        app.MapFallbackToFile("index.html");

        // health check
        app.MapGet("/health", () => Results.Ok(new { status = "ok", time = DateTime.UtcNow }));

        return app;
    }
}

public static class Program
{
    public static void Main(string[] args)
    {
        FinanceApiHost.Build(new WebApplicationOptions { Args = args }).Run();
    }
}
