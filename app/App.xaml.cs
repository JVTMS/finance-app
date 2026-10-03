using System.Threading;
using System.Windows;

namespace Finance.App;

public partial class App : Application
{
    private static Mutex? _singleInstance;

    protected override void OnStartup(StartupEventArgs e)
    {
        // uma única janela do FINANCE por máquina
        _singleInstance = new Mutex(true, "FINANCE.App.SingleInstance", out var createdNew);
        if (!createdNew)
        {
            Shutdown(0);
            return;
        }
        base.OnStartup(e);
    }
}
