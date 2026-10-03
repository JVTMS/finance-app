namespace Finance.Api.Entities;

/// <summary>type: receita | despesa | transferencia | investimento</summary>
public class Transaction
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public required string Type { get; set; }
    public required string Name { get; set; }
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
    public int AccountId { get; set; }
    public Account? Account { get; set; }
    public int? ToAccountId { get; set; }
    public Account? ToAccount { get; set; }
    public string Description { get; set; } = "";
    public int? InvestmentId { get; set; }
    public Investment? Investment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
