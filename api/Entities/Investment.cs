namespace Finance.Api.Entities;

public class Investment
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public required string Name { get; set; }
    public string Type { get; set; } = "CDB";
    public string Institution { get; set; } = "";
    public string Note { get; set; } = "";
    public DateOnly StartedAt { get; set; }
    public decimal Invested { get; set; }
    public decimal Current { get; set; }

    public List<InvestmentMark> History { get; set; } = [];
}

/// <summary>Marcação pontual do valor de mercado do investimento.</summary>
public class InvestmentMark
{
    public int Id { get; set; }
    public int InvestmentId { get; set; }
    public Investment? Investment { get; set; }
    public DateOnly Date { get; set; }
    public decimal Value { get; set; }
}
