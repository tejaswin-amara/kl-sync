$running = $true
while ($running) {
    $procs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -like "*next*build*" }
    if ($procs) {
        Write-Output "Waiting for next build processes to finish..."
        Start-Sleep -Seconds 3
    } else {
        $running = $false
        Write-Output "All next build processes finished."
    }
}
