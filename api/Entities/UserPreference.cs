namespace Finance.Api.Entities;

/// <summary>Preferência do usuário (tema, cinematic, performance, som…).</summary>
public class UserPreference
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public required string Key { get; set; }
    public required string Value { get; set; } // JSON serializado
}
