using Finance.Api.Auth;
using Finance.Api.Data;
using Finance.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(o =>
{
    // InvestmentMark.Investment ↔ Investment.History: o EF popula as navegações
    // mesmo com AsNoTracking; sem isso a serialização entra em ciclo.
    o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddDbContext<FinanceDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Finance")));
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

// health para o launcher
app.MapGet("/health", () => Results.Ok(new { status = "ok", time = DateTime.UtcNow }));

app.Run();
