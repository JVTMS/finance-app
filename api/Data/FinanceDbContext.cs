using Finance.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Finance.Api.Data;

public class FinanceDbContext(DbContextOptions<FinanceDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Investment> Investments => Set<Investment>();
    public DbSet<InvestmentMark> InvestmentMarks => Set<InvestmentMark>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<UserPreference> Preferences => Set<UserPreference>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Name).HasMaxLength(120);
            e.Property(u => u.Email).HasMaxLength(180);
        });

        mb.Entity<Account>(e =>
        {
            e.Property(a => a.Name).HasMaxLength(80);
            e.Property(a => a.Institution).HasMaxLength(120);
        });

        mb.Entity<Transaction>(e =>
        {
            e.Property(t => t.Type).HasMaxLength(20);
            e.Property(t => t.Name).HasMaxLength(140);
            e.Property(t => t.Description).HasMaxLength(400);
            e.Property(t => t.Amount).HasPrecision(14, 2);
            e.HasIndex(t => new { t.UserId, t.Date });
            e.HasOne(t => t.Account)
                .WithMany()
                .HasForeignKey(t => t.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(t => t.ToAccount)
                .WithMany()
                .HasForeignKey(t => t.ToAccountId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(t => t.Category)
                .WithMany()
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(t => t.Investment)
                .WithMany()
                .HasForeignKey(t => t.InvestmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        mb.Entity<Investment>(e =>
        {
            e.Property(i => i.Name).HasMaxLength(140);
            e.Property(i => i.Institution).HasMaxLength(120);
            e.Property(i => i.Invested).HasPrecision(14, 2);
            e.Property(i => i.Current).HasPrecision(14, 2);
            e.HasMany(i => i.History)
                .WithOne(m => m.Investment!)
                .HasForeignKey(m => m.InvestmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        mb.Entity<InvestmentMark>(e =>
        {
            e.Property(m => m.Value).HasPrecision(14, 2);
            e.HasIndex(m => new { m.InvestmentId, m.Date });
        });

        mb.Entity<Category>(e =>
        {
            e.Property(c => c.Kind).HasMaxLength(10);
            e.Property(c => c.Name).HasMaxLength(60);
            e.Property(c => c.Icon).HasMaxLength(40);
            e.Property(c => c.Color).HasMaxLength(20);
        });

        mb.Entity<Notification>(e =>
        {
            e.Property(n => n.Type).HasMaxLength(10);
            e.Property(n => n.Title).HasMaxLength(140);
            e.Property(n => n.Message).HasMaxLength(300);
            e.HasIndex(n => new { n.UserId, n.CreatedAt });
        });

        mb.Entity<UserPreference>(e =>
        {
            e.HasIndex(p => new { p.UserId, p.Key }).IsUnique();
            e.Property(p => p.Key).HasMaxLength(60);
        });
    }
}
