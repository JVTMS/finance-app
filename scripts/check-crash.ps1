$events = Get-WinEvent -FilterHashtable @{LogName='Application'; Level=2} -MaxEvents 8 -ErrorAction SilentlyContinue
foreach ($e in $events) {
    if ($e.ProviderName -match '.NET|Application Error|Windows Error') {
        Write-Output ("=== " + $e.TimeCreated + " [" + $e.ProviderName + "]")
        $lines = $e.Message -split "`n"
        Write-Output (($lines | Select-Object -First 14) -join "`n")
        Write-Output "---"
    }
}
