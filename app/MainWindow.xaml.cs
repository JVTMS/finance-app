using System.IO;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Animation;
using Finance.Api;
using Microsoft.AspNetCore.Builder;

namespace Finance.App;

/// <summary>Erro dedicado: WebView2 Runtime ausente na máquina.</summary>
public class WebView2MissingException : Exception
{
    public WebView2MissingException() : base("WebView2 Runtime não encontrado.") { }
}

public partial class MainWindow : Window
{
    private const string WebView2DownloadUrl = "https://developer.microsoft.com/microsoft-edge/webview2/";
    private WebApplication? _api;
    private int _port;

    public MainWindow()
    {
        InitializeComponent();
        try
        {
            var icoPath = Path.Combine(AppContext.BaseDirectory, "finance.ico");
            if (File.Exists(icoPath))
                Icon = System.Windows.Media.Imaging.BitmapFrame.Create(new Uri(icoPath));
        }
        catch { /* ícone é cosmético */ }
        Loaded += OnLoaded;
        Closing += OnClosing;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        StartSpinner();
        try
        {
            SetLoading("Iniciando servidor FINANCE…", "");
            _port = HttpPortPicker.Free(5280);
            _api = FinanceApiHost.Build(
                new Microsoft.AspNetCore.Builder.WebApplicationOptions
                {
                    ContentRootPath = AppContext.BaseDirectory,
                    EnvironmentName = "Production",
                },
                connectionStringOverride: null, // appsettings.json: cluster local na porta 5433
                urls: $"http://127.0.0.1:{_port}");
            await _api.StartAsync();

            SetLoading("Abrindo interface…", "");
            await ShowAppAsync();
        }
        catch (WebView2MissingException)
        {
            ShowError(
                "O componente de interface (WebView2 Runtime) não está instalado neste computador.\n\n" +
                "Baixe-o da Microsoft (gratuito, ~1 minuto), instale e abra o FINANCE novamente. " +
                "O link já foi copiado para a área de transferência:",
                WebView2DownloadUrl);
        }
        catch (Exception ex)
        {
            ShowError(
                "Falha ao iniciar o FINANCE.\n\n" +
                "Se o problema persistir, envie esta mensagem:\n" + ex.Message);
        }
    }

    private async Task ShowAppAsync()
    {
        var userData = Path.Combine(AppContext.BaseDirectory, "data", "webview2");
        Directory.CreateDirectory(userData);
        var env = await Microsoft.Web.WebView2.Core.CoreWebView2Environment.CreateAsync(
            browserExecutableFolder: null,
            userDataFolder: userData);
        await Web.EnsureCoreWebView2Async(env);
        Web.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
        Web.Source = new Uri($"http://127.0.0.1:{_port}/");

        LoadingPanel.Visibility = Visibility.Collapsed;
        WebViewPanel.Visibility = Visibility.Visible;
    }

    private void ShowError(string message, string? linkToCopy = null)
    {
        LoadingPanel.Visibility = Visibility.Collapsed;
        WebViewPanel.Visibility = Visibility.Collapsed;
        ErrorText.Text = message;
        if (linkToCopy is not null)
        {
            LinkText.Text = linkToCopy;
            LinkText.Visibility = Visibility.Visible;
            try { Clipboard.SetText(linkToCopy); } catch { /* área de transferência pode falhar */ }
        }
        else
        {
            LinkText.Visibility = Visibility.Collapsed;
        }
        ErrorPanel.Visibility = Visibility.Visible;
    }

    private void CopyLink_Click(object sender, RoutedEventArgs e)
    {
        try { Clipboard.SetText(LinkText.Text); } catch { }
    }

    private void SetLoading(string main, string detail)
    {
        LoadingText.Text = main;
        LoadingDetail.Text = detail;
        LogFile.Append(AppContext.BaseDirectory, $"[startup] {main} {detail}");
    }

    private void StartSpinner()
    {
        if (LoadingPanel.Children.Count > 0 && LoadingPanel.Children[0] is System.Windows.Controls.StackPanel sp &&
            sp.Children[0] is System.Windows.Shapes.Ellipse ell)
        {
            var rotate = new RotateTransform(0);
            ell.RenderTransform = rotate;
            ell.RenderTransformOrigin = new Point(0.5, 0.5);
            var anim = new DoubleAnimation(0, 360, new Duration(TimeSpan.FromSeconds(1.1)))
            {
                RepeatBehavior = RepeatBehavior.Forever,
            };
            rotate.BeginAnimation(RotateTransform.AngleProperty, anim);
        }
    }

    private async void OnClosing(object? sender, System.ComponentModel.CancelEventArgs e)
    {
        try
        {
            if (_api is not null)
                await _api.StopAsync();
        }
        catch { /* best effort */ }
    }
}

/// <summary>Escolhe a primeira porta livre a partir da indicada.</summary>
public static class HttpPortPicker
{
    public static int Free(int preferred)
    {
        for (int p = preferred; p < preferred + 20; p++)
        {
            try
            {
                var l = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, p);
                l.Start();
                l.Stop();
                return p;
            }
            catch (System.Net.Sockets.SocketException) { /* ocupada */ }
        }
        return preferred;
    }
}

/// <summary>Log de diagnóstico em data/financelog.txt — ajuda a dar suporte em qualquer máquina.</summary>
public static class LogFile
{
    private static readonly object Gate = new();
    public static void Append(string appBase, string line)
    {
        try
        {
            lock (Gate)
            {
                var dir = Path.Combine(appBase, "data");
                Directory.CreateDirectory(dir);
                File.AppendAllText(Path.Combine(dir, "financelog.txt"),
                    $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} {line}{Environment.NewLine}");
            }
        }
        catch { /* nunca derrubar o app por causa de log */ }
    }
}
