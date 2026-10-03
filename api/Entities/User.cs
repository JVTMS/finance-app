namespace Finance.Api.Entities;

public class User
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }        // único, minúsculo
    public required string PasswordHash { get; set; } // iterações.salt.hash (PBKDF2)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Account> Accounts { get; set; } = [];
    public List<Transaction> Transactions { get; set; } = [];
    public List<Investment> Investments { get; set; } = [];
    public List<Category> Categories { get; set; } = [];
    public List<Notification> Notifications { get; set; } = [];
    public List<UserPreference> Preferences { get; set; } = [];
}
