namespace Finance.Api.Entities;

/// <summary>kind: receita | despesa</summary>
public class Category
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public required string Kind { get; set; }
    public required string Name { get; set; }
    public string Icon { get; set; } = "circle-ellipsis";
    public string Color { get; set; } = "#94a3b8";
}
