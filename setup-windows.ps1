<#
.SYNOPSIS
    Off-Market Automobiles - Windows Setup
.DESCRIPTION
    Installiert Node.js 22, PostgreSQL 16, Git, klont das Repository nach
    E:\KI_Off-Market_Dealer, richtet die Datenbank ein und startet die App.
    Aufruf: Rechtsklick > "Als Administrator ausfuehren"
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Hilfsfunktionen ────────────────────────────────────────────────────────────

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  +==================================================+" -ForegroundColor Cyan
    Write-Host "  |    Off-Market Automobiles -- Windows Setup       |" -ForegroundColor Cyan
    Write-Host "  |    Ziel: C:\Users\Test\Desktop\KI_Off-Market_Dealer |" -ForegroundColor Cyan
    Write-Host "  +==================================================+" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Section($text) {
    Write-Host ""
    Write-Host "  [$text]" -ForegroundColor Cyan
    Write-Host "  $('-' * ($text.Length + 2))" -ForegroundColor DarkCyan
}

function Write-OK($text)   { Write-Host "  [OK] $text" -ForegroundColor Green }
function Write-Info($text) { Write-Host "  --> $text" -ForegroundColor Yellow }
function Write-Warn($text) { Write-Host "  [!] $text" -ForegroundColor Magenta }

# throw statt exit damit finally immer ausgefuehrt wird
function Write-Err($text)  {
    Write-Host ""
    Write-Host "  [FEHLER] $text" -ForegroundColor Red
    Write-Host ""
    throw $text
}

function Refresh-EnvPath {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path","User")
}

function New-RandomAlphaNum([int]$length) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    $rng   = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $bytes = New-Object byte[] $length
    $rng.GetBytes($bytes)
    -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}

function New-RandomBase64([int]$byteCount) {
    $bytes = New-Object byte[] $byteCount
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    [System.Convert]::ToBase64String($bytes)
}

function Wait-ForPostgres([string]$pgBin, [string]$superPass, [int]$maxSec = 60) {
    $env:PGPASSWORD = $superPass
    $deadline = (Get-Date).AddSeconds($maxSec)
    while ((Get-Date) -lt $deadline) {
        & "$pgBin\pg_isready.exe" -U postgres 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

# ── Hauptlogik (try/finally damit Fenster nie sofort schliesst) ────────────────

try {

    Write-Banner

    # ── Admin-Rechte pruefen ───────────────────────────────────────────────────

    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
               ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

    if (-not $isAdmin) {
        Write-Host "  Dieses Skript benoetigt Administrator-Rechte." -ForegroundColor Red
        Write-Host ""
        Write-Host "  So starten:" -ForegroundColor Yellow
        Write-Host "  Rechtsklick auf setup-windows.ps1" -ForegroundColor White
        Write-Host "  > 'Mit PowerShell als Administrator ausfuehren'" -ForegroundColor White
        Write-Err "Nicht als Administrator gestartet."
    }
    Write-OK "Administrator-Rechte bestaetigt"

    # ── winget pruefen ─────────────────────────────────────────────────────────

    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Write-Host ""
        Write-Host "  winget wurde nicht gefunden." -ForegroundColor Red
        Write-Host "  Loesung: Microsoft Store oeffnen > nach 'App Installer' suchen > Aktualisieren" -ForegroundColor Yellow
        Write-Err "winget nicht verfuegbar."
    }
    Write-OK "winget verfuegbar"

    # ── Benutzereingaben ───────────────────────────────────────────────────────

    Write-Section "Konfiguration"
    Write-Host ""

    $adminEmail = ""
    while ($adminEmail -notmatch '^[^@]+@[^@]+\.[^@]+$') {
        $adminEmail = (Read-Host "  Admin E-Mail").Trim()
        if ($adminEmail -notmatch '^[^@]+@[^@]+\.[^@]+$') {
            Write-Host "  Ungueltige E-Mail, bitte erneut eingeben." -ForegroundColor Red
        }
    }

    $adminPasswordPlain = ""
    while ($adminPasswordPlain.Length -lt 12) {
        $secPwd = Read-Host "  Admin-Passwort (mind. 12 Zeichen, Gross+Klein+Zahl+Sonderzeichen)" -AsSecureString
        $adminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPwd))
        if ($adminPasswordPlain.Length -lt 12) {
            Write-Host "  Zu kurz! Bitte mind. 12 Zeichen." -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-OK "Eingaben akzeptiert"

    # ── Secrets & Pfade ────────────────────────────────────────────────────────

    $BASE_DIR    = "C:\Users\Test\Desktop\KI_Off-Market_Dealer"
    $APP_DIR     = "$BASE_DIR\app"
    $UPLOAD_DIR  = "$BASE_DIR\uploads"
    $REPO_URL    = "https://github.com/razer987/offmarketdealer.git"
    $DB_NAME     = "offmarketdealer"
    $DB_USER     = "omdealer"
    $DB_PASS     = New-RandomAlphaNum 24
    $PG_SUPER_PW = New-RandomAlphaNum 24
    $ADMIN_PATH  = New-RandomAlphaNum 10
    $JWT_ACCESS  = New-RandomBase64 64
    $JWT_REFRESH = New-RandomBase64 64
    $JWT_ADMIN   = New-RandomBase64 64
    $CSRF_SECRET = New-RandomBase64 32

    Write-Info "Secrets generiert"

    # ── Verzeichnisse anlegen ──────────────────────────────────────────────────

    Write-Section "Verzeichnisse anlegen"

    foreach ($dir in @($BASE_DIR, $APP_DIR, $UPLOAD_DIR)) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir | Out-Null
            Write-OK "Erstellt: $dir"
        } else {
            Write-OK "Bereits vorhanden: $dir"
        }
    }

    # ── Node.js installieren ───────────────────────────────────────────────────

    Write-Section "1/4 -- Node.js 22 LTS"

    $nodeInstalled = $false
    try {
        $nodeVer = node -v 2>$null
        if ($nodeVer -match 'v(\d+)\.' -and [int]$Matches[1] -ge 22) {
            Write-OK "Node.js $nodeVer bereits installiert"
            $nodeInstalled = $true
        }
    } catch {}

    if (-not $nodeInstalled) {
        Write-Info "Installiere Node.js 22 LTS via winget (kann 1-2 Min. dauern)..."
        winget install --id OpenJS.NodeJS.LTS `
            --accept-package-agreements --accept-source-agreements --silent
        Refresh-EnvPath

        # winget-PATH-Aenderungen gelten erst in neuer Session -- Node.js-Pfad direkt eintragen
        $nodePath = "C:\Program Files\nodejs"
        if ((Test-Path "$nodePath\node.exe") -and ($env:Path -notlike "*nodejs*")) {
            $env:Path = "$nodePath;" + $env:Path
        }

        if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
            Write-Err "Node.js wurde installiert, ist aber nicht erreichbar. Bitte PowerShell-Fenster schliessen, neu als Administrator oeffnen und Skript erneut starten."
        }
        Write-OK "Node.js $(node -v) installiert"
    } else {
        Refresh-EnvPath
    }

    # ── Git installieren ───────────────────────────────────────────────────────

    Write-Section "2/4 -- Git"

    if (Get-Command git -ErrorAction SilentlyContinue) {
        Write-OK "Git bereits installiert: $(git --version)"
    } else {
        Write-Info "Installiere Git via winget..."
        winget install --id Git.Git `
            --accept-package-agreements --accept-source-agreements --silent
        Refresh-EnvPath
        Write-OK "Git installiert: $(git --version)"
    }

    # ── PostgreSQL installieren ────────────────────────────────────────────────

    Write-Section "3/4 -- PostgreSQL 16"

    $PG_BIN = "C:\Program Files\PostgreSQL\16\bin"

    if (Test-Path "$PG_BIN\psql.exe") {
        Write-OK "PostgreSQL bereits installiert"
    } else {
        Write-Info "Installiere PostgreSQL 16 (dauert ca. 2-3 Minuten)..."
        Write-Info "Superuser-Passwort wird automatisch auf gesetzt: $PG_SUPER_PW"

        winget install --id PostgreSQL.PostgreSQL.16 `
            --accept-package-agreements --accept-source-agreements `
            --override "--mode unattended --superpassword `"$PG_SUPER_PW`" --serverport 5432 --prefix `"C:\Program Files\PostgreSQL\16`" --datadir `"C:\Program Files\PostgreSQL\16\data`""

        Refresh-EnvPath

        if (-not (Test-Path "$PG_BIN\psql.exe")) {
            Write-Err "PostgreSQL wurde installiert aber psql.exe nicht gefunden unter $PG_BIN. Bitte PostgreSQL manuell installieren und Skript erneut starten."
        }
        Write-OK "PostgreSQL 16 installiert"
    }

    # Dienst starten falls noetig
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pgService) {
        if ($pgService.Status -ne 'Running') {
            Start-Service $pgService.Name
            Start-Sleep -Seconds 4
        }
        Write-OK "PostgreSQL-Dienst laeuft ($($pgService.Name))"
    } else {
        Write-Warn "PostgreSQL-Dienst nicht automatisch gefunden -- versuche trotzdem fortzufahren."
    }

    # ── Datenbank & Benutzer anlegen ───────────────────────────────────────────

    Write-Section "4/4 -- Datenbank einrichten"

    Write-Info "Warte auf PostgreSQL-Bereitschaft..."
    $env:PGPASSWORD = $PG_SUPER_PW
    if (-not (Wait-ForPostgres -pgBin $PG_BIN -superPass $PG_SUPER_PW)) {
        Write-Err "PostgreSQL antwortet nicht nach 60 Sekunden. Bitte Dienst manuell starten (Dienste-App > postgresql-x64-16 > Starten) und Skript erneut ausfuehren."
    }
    Write-OK "PostgreSQL bereit"

    $psql = "$PG_BIN\psql.exe"
    $env:PGPASSWORD = $PG_SUPER_PW

    $dbExists = (& $psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>$null).Trim()
    if ($dbExists -ne '1') {
        & $psql -U postgres -c "CREATE DATABASE $DB_NAME;" | Out-Null
        Write-OK "Datenbank '$DB_NAME' erstellt"
    } else {
        Write-OK "Datenbank '$DB_NAME' bereits vorhanden"
    }

    $userExists = (& $psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>$null).Trim()
    if ($userExists -ne '1') {
        & $psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" | Out-Null
        Write-OK "Benutzer '$DB_USER' erstellt"
    } else {
        & $psql -U postgres -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';" | Out-Null
        Write-OK "Benutzer '$DB_USER' aktualisiert"
    }

    & $psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" | Out-Null
    & $psql -U postgres -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;" | Out-Null
    Write-OK "Berechtigungen gesetzt"

    # ── Repository klonen ──────────────────────────────────────────────────────

    Write-Section "App-Code herunterladen"

    if (Test-Path "$APP_DIR\.git") {
        Write-Info "Bereits vorhanden -- aktualisiere..."
        Set-Location $APP_DIR
        git pull --ff-only
    } else {
        Write-Info "Lade Repository herunter..."
        git clone $REPO_URL $APP_DIR
        Set-Location $APP_DIR
    }
    Write-OK "Code in $APP_DIR"

    # ── .env.local erstellen ───────────────────────────────────────────────────

    Write-Section "Konfigurationsdatei erstellen"

    $uploadDirFwd = $UPLOAD_DIR -replace '\\', '/'

    $envContent = @"
# Automatisch generiert von setup-windows.ps1 -- $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# Database
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

# JWT Secrets
JWT_ACCESS_SECRET="${JWT_ACCESS}"
JWT_REFRESH_SECRET="${JWT_REFRESH}"
JWT_ADMIN_SECRET="${JWT_ADMIN}"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# CSRF
CSRF_SECRET="${CSRF_SECRET}"

# Bcrypt
BCRYPT_ROUNDS="12"

# Admin
ADMIN_PATH_SECRET="${ADMIN_PATH}"
ADMIN_INITIAL_EMAIL="${adminEmail}"
ADMIN_INITIAL_PASSWORD="${adminPasswordPlain}"
ADMIN_EMAIL="${adminEmail}"

# Email (Resend -- leer lassen fuer lokale Tests)
EMAIL_FROM="test@localhost"
RESEND_API_KEY=""

# File uploads
UPLOAD_DIR="${uploadDirFwd}"
MAX_FILE_SIZE_MB="10"

# Security
ALLOWED_ORIGINS="http://localhost:3000"
RATE_LIMIT_LOGIN_MAX="5"
RATE_LIMIT_LOGIN_WINDOW_MIN="15"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
"@

    $envContent | Set-Content -Path "$APP_DIR\.env.local" -Encoding UTF8
    Write-OK ".env.local geschrieben"

    # ── npm install ────────────────────────────────────────────────────────────

    Write-Section "Node-Pakete installieren"
    Write-Info "npm install (kann 2-3 Minuten dauern)..."
    npm install 2>&1 | Select-Object -Last 5
    Write-OK "npm install abgeschlossen"

    # ── Prisma ────────────────────────────────────────────────────────────────

    Write-Section "Datenbank-Tabellen erstellen"
    Write-Info "prisma migrate dev..."
    npx prisma migrate dev --name init --schema="$APP_DIR\prisma\schema.prisma" 2>&1 | Select-Object -Last 8
    Write-OK "Tabellen erstellt"

    Write-Section "Admin-Account anlegen"
    npm run prisma:seed 2>&1 | Select-Object -Last 5
    Write-OK "Admin-Account angelegt"

    # ── Zugangsdaten speichern ─────────────────────────────────────────────────

    $summaryPath = "$BASE_DIR\ZUGANGSDATEN.txt"
    @"
Off-Market Automobiles -- Zugangsdaten
Erstellt: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
===============================================

App-Verzeichnis  : $APP_DIR
Upload-Ordner    : $UPLOAD_DIR

Frontend         : http://localhost:3000
Admin-Panel      : http://localhost:3000/$ADMIN_PATH/login

Admin E-Mail     : $adminEmail

Datenbank        : $DB_NAME
DB-Benutzer      : $DB_USER
DB-Passwort      : $DB_PASS
PG-Superuser     : postgres
PG-Passwort      : $PG_SUPER_PW

App erneut starten:
  cd $APP_DIR
  npm run dev

WICHTIG: Diese Datei sicher aufbewahren und NICHT weitergeben!
"@ | Set-Content -Path $summaryPath -Encoding UTF8

    Write-OK "Zugangsdaten gespeichert: $summaryPath"

    # ── Ergebnis anzeigen ──────────────────────────────────────────────────────

    Write-Host ""
    Write-Host "  +==================================================+" -ForegroundColor Green
    Write-Host "  |        Installation erfolgreich!                 |" -ForegroundColor Green
    Write-Host "  +==================================================+" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Frontend  : http://localhost:3000" -ForegroundColor White
    Write-Host "  Admin-URL : http://localhost:3000/$ADMIN_PATH/login" -ForegroundColor White
    Write-Host "  Admin     : $adminEmail" -ForegroundColor White
    Write-Host ""
    Write-Host "  Alle Zugangsdaten in: $summaryPath" -ForegroundColor Yellow
    Write-Host ""

    $startNow = Read-Host "  App jetzt starten? (j/n) [j]"
    if ($startNow -eq '' -or $startNow -eq 'j' -or $startNow -eq 'J') {
        Write-Info "Starte Entwicklungsserver in neuem Fenster..."
        Start-Process powershell -ArgumentList "-NoExit", "-Command",
            "Write-Host 'Server laeuft -- Strg+C zum Beenden' -ForegroundColor Cyan; Set-Location '$APP_DIR'; npm run dev"
        Start-Sleep -Seconds 6
        Start-Process "http://localhost:3000"
        Write-OK "Browser geoeffnet. Server-Fenster offen lassen!"
    }

} catch {
    Write-Host ""
    Write-Host "  ======================================" -ForegroundColor Red
    Write-Host "  FEHLER: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  ======================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Bitte den Fehlertext oben fotografieren/abtippen" -ForegroundColor Yellow
    Write-Host "  und dem Support mitteilen." -ForegroundColor Yellow
    Write-Host ""
} finally {
    # Fenster bleibt IMMER offen
    Read-Host "`n  Enter druecken zum Beenden"
}
