# Script to install PS2EXE and convert our PowerShell script to an executable

# Check if PS2EXE is installed
$ps2exeModule = Get-Module -ListAvailable -Name PS2EXE
if (-not $ps2exeModule) {
    Write-Host "Installing PS2EXE module..." -ForegroundColor Cyan
    Install-Module -Name PS2EXE -Scope CurrentUser -Force
    Write-Host "PS2EXE module installed successfully!" -ForegroundColor Green
}
else {
    Write-Host "PS2EXE module is already installed." -ForegroundColor Green
}

# Import the module
Import-Module PS2EXE

# Path to the PowerShell script
$scriptPath = Join-Path $PSScriptRoot "start-fingerprint.ps1"
# Path for the output executable
$exePath = Join-Path $PSScriptRoot "StartFingerprintServices.exe"

# Check if the script exists
if (-not (Test-Path $scriptPath)) {
    Write-Host "Error: PowerShell script not found at $scriptPath" -ForegroundColor Red
    exit 1
}

# Convert the script to an executable
Write-Host "Converting PowerShell script to executable..." -ForegroundColor Cyan
Invoke-ps2exe -InputFile $scriptPath -OutputFile $exePath -NoConsole:$false -NoOutput:$false -NoError:$false -NoVisualStyles:$false -RequireAdmin:$false -IconFile:$null

# Check if the executable was created
if (Test-Path $exePath) {
    Write-Host "Executable created successfully at: $exePath" -ForegroundColor Green
    
    # Create a shortcut on the desktop
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = Join-Path $desktopPath "Start Fingerprint Services.lnk"
    
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $exePath
    $Shortcut.WorkingDirectory = $PSScriptRoot
    $Shortcut.Description = "Start Fingerprint Services for Attendance System"
    $Shortcut.Save()
    
    Write-Host "Shortcut created on desktop: 'Start Fingerprint Services'" -ForegroundColor Green
    Write-Host "You can now run the fingerprint services by double-clicking the shortcut or the exe file." -ForegroundColor Yellow
}
else {
    Write-Host "Error: Failed to create executable" -ForegroundColor Red
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 