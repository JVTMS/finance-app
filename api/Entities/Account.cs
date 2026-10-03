namespace Finance.Api.Entities;

public class Account
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public required string Name { get; set; }
    public string Institution { get; set; } = "";
    public string Type { get; set; } = "conta"; // conta | poupanca | carteira | outro
    public string Color { get; set; } = "#7c8ba1";
    public decimal InitialBalance { get; set; }
}
