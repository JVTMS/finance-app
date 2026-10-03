namespace Finance.Api.Entities;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public string Type { get; set; } = "info"; // success | warn | info | error
    public required string Title { get; set; }
    public string Message { get; set; } = "";
    public bool Read { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
