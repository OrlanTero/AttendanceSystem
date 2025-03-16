# PowerShell script to start all the necessary services for the fingerprint functionality

# Add a title to the console window
$host.UI.RawUI.WindowTitle = "Fingerprint Services Controller"

# Get the script directory - this is critical for correct path resolution
$scriptDirectory = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
if ([string]::IsNullOrEmpty($scriptDirectory)) {
    $scriptDirectory = Get-Location
}
Write-Host "Script is running from: $scriptDirectory" -ForegroundColor Cyan

# Function to display colored messages
function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$ForegroundColor = "White"
    )
    
    Write-Host $Message -ForegroundColor $ForegroundColor
    # Also add to log for GUI display
    $script:logMessages += "$Message`r`n"
}

# Initialize log messages
$script:logMessages = ""

Write-ColorMessage "Starting Fingerprint Services..." "Green"

# Function to check if a process is running on a specific port
function Test-PortInUse {
    param(
        [int]$Port
    )
    
    $connections = netstat -ano | findstr ":$Port "
    return $connections.Length -gt 0
}

# Function to wait for a service to be available on a specific port
function Wait-ForService {
    param(
        [string]$ServiceName,
        [string]$HostName,
        [int]$Port,
        [int]$TimeoutSeconds = 30
    )
    
    Write-ColorMessage "Waiting for $ServiceName to be available on $HostName`:$Port..." "Cyan"
    
    $startTime = Get-Date
    $timeout = New-TimeSpan -Seconds $TimeoutSeconds
    $connected = $false
    
    while (-not $connected -and ((Get-Date) - $startTime) -lt $timeout) {
        try {
            $tcpClient = New-Object System.Net.Sockets.TcpClient
            $asyncResult = $tcpClient.BeginConnect($HostName, $Port, $null, $null)
            $wait = $asyncResult.AsyncWaitHandle.WaitOne(1000)
            
            if ($wait) {
                $tcpClient.EndConnect($asyncResult)
                $connected = $true
                Write-ColorMessage "$ServiceName is now available!" "Green"
            }
            
            $tcpClient.Close()
        }
        catch {
            # Connection failed, wait and try again
            Start-Sleep -Seconds 1
            Write-ColorMessage "Waiting for $ServiceName to start..." "Yellow"
        }
    }
    
    if (-not $connected) {
        Write-ColorMessage "Timeout waiting for $ServiceName to be available." "Red"
        return $false
    }
    
    return $true
}

# 1. Start the VB.NET Fingerprint API Service
Write-ColorMessage "Starting VB.NET Fingerprint API Service..." "Cyan"
$fingerprintServicePath = Join-Path -Path $scriptDirectory -ChildPath "FingerprintAPI\FingerprintAPIService\FingerprintAPIService\bin\Debug\net8.0\FingerprintAPIService.exe"
Write-ColorMessage "Looking for fingerprint service at: $fingerprintServicePath" "Yellow"

if (Test-Path -Path $fingerprintServicePath) {
    # Check if the service is already running on port 5000
    if (Test-PortInUse -Port 5000) {
        Write-ColorMessage "Fingerprint service is already running on port 5000" "Yellow"
    }
    else {
        # Get the directory containing the executable
        $serviceDirectory = Split-Path -Parent -Path $fingerprintServicePath
        Write-ColorMessage "Service directory: $serviceDirectory" "Yellow"
        
        # Start the service with elevated privileges
        try {
            # Start the service in a new window with admin rights if possible
            Start-Process -FilePath $fingerprintServicePath -WorkingDirectory $serviceDirectory -Verb RunAs -ErrorAction SilentlyContinue
            Write-ColorMessage "Fingerprint service started on port 5000" "Green"
        }
        catch {
            # If RunAs fails, try to start normally
            Write-ColorMessage "Could not start with admin rights, trying normal startup" "Yellow"
            Start-Process -FilePath $fingerprintServicePath -WorkingDirectory $serviceDirectory
            Write-ColorMessage "Fingerprint service started on port 5000 (without admin rights)" "Yellow"
        }
        
        # Wait for the service to be available
        $serviceReady = Wait-ForService -ServiceName "Fingerprint Service" -HostName "localhost" -Port 5000 -TimeoutSeconds 30
        
        if (-not $serviceReady) {
            Write-ColorMessage "WARNING: Fingerprint service may not be running correctly. The application may not work properly." "Red"
            Write-ColorMessage "Please check if the VB.NET service is properly built and configured." "Red"
            
            # Ask if the user wants to continue anyway
            Write-ColorMessage "Do you want to continue anyway? (Y/N)" "Yellow"
            $response = Read-Host
            if ($response -ne "Y" -and $response -ne "y") {
                Write-ColorMessage "Exiting..." "Red"
                exit 1
            }
        }
    }
}
else {
    Write-ColorMessage "Error: Fingerprint service executable not found at $fingerprintServicePath" "Red"
    Write-ColorMessage "Please build the VB.NET project first" "Red"
    
    # Pause to show the error message
    Write-ColorMessage "Press any key to exit..." "Yellow"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 2. Start the Express.js API Server
Write-ColorMessage "Starting Express.js API Server..." "Cyan"
$apiServerPath = Join-Path -Path $scriptDirectory -ChildPath "api\server.js"
Write-ColorMessage "Looking for API server at: $apiServerPath" "Yellow"

if (Test-Path -Path $apiServerPath) {
    # Check if the API server is already running on port 3000
    if (Test-PortInUse -Port 3000) {
        Write-ColorMessage "API server is already running on port 3000" "Yellow"
    }
    else {
        # Get the API directory
        $apiDirectory = Join-Path -Path $scriptDirectory -ChildPath "api"
        Write-ColorMessage "API directory: $apiDirectory" "Yellow"
        
        # Start the API server in a new window
        Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$apiDirectory'; node server.js"
        Write-ColorMessage "API server started on port 3000" "Green"
        
        # Wait for the API server to be available
        $apiReady = Wait-ForService -ServiceName "API Server" -HostName "localhost" -Port 3000 -TimeoutSeconds 30
        
        if (-not $apiReady) {
            Write-ColorMessage "WARNING: API server may not be running correctly. The application may not work properly." "Red"
            
            # Ask if the user wants to continue anyway
            Write-ColorMessage "Do you want to continue anyway? (Y/N)" "Yellow"
            $response = Read-Host
            if ($response -ne "Y" -and $response -ne "y") {
                Write-ColorMessage "Exiting..." "Red"
                exit 1
            }
        }
    }
}
else {
    Write-ColorMessage "Error: API server not found at $apiServerPath" "Red"
    
    # Pause to show the error message
    Write-ColorMessage "Press any key to exit..." "Yellow"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 3. Start the Electron Application
Write-ColorMessage "Starting Electron Application..." "Cyan"
# Check if the Electron app is already running
$electronProcess = Get-Process -Name "electron" -ErrorAction SilentlyContinue
if ($electronProcess) {
    Write-ColorMessage "Electron application is already running" "Yellow"
}
else {
    # Start the Electron app
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$scriptDirectory'; npm start"
    Write-ColorMessage "Electron application started" "Green"
}

Write-ColorMessage "All services started successfully!" "Green"
Write-ColorMessage "Press Ctrl+C to stop all services" "Yellow"

# Keep the script running to allow the user to stop all services with Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    # Clean up when the script is interrupted
    Write-ColorMessage "Stopping all services..." "Red"
    
    # Stop the VB.NET Fingerprint API Service
    $fingerprintProcess = Get-Process -Name "FingerprintAPIService" -ErrorAction SilentlyContinue
    if ($fingerprintProcess) {
        $fingerprintProcess | Stop-Process -Force
        Write-ColorMessage "Fingerprint service stopped" "Green"
    }
    
    # Stop the Electron app
    $electronProcess = Get-Process -Name "electron" -ErrorAction SilentlyContinue
    if ($electronProcess) {
        $electronProcess | Stop-Process -Force
        Write-ColorMessage "Electron application stopped" "Green"
    }
    
    # Stop any node processes running the API server
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | Stop-Process -Force
        Write-ColorMessage "API server stopped" "Green"
    }
    
    Write-ColorMessage "All services stopped" "Green"
    
    # Pause before exiting
    Write-ColorMessage "Press any key to exit..." "Yellow"
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} 