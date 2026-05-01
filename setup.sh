#!/usr/bin/env bash
# ==============================================================================
#  Off-Market Automobiles — Server Setup Script
#  Führt eine vollständige Installation auf Ubuntu 22.04 LTS durch.
#  Aufruf: sudo bash setup.sh
# ==============================================================================
set -euo pipefail

# ── Farben ─────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log_section() { echo -e "\n${BOLD}${BLUE}══════════════════════════════════════════${RESET}"; echo -e "${BOLD}${BLUE}  $1${RESET}"; echo -e "${BOLD}${BLUE}══════════════════════════════════════════${RESET}"; }
log_ok()      { echo -e "  ${GREEN}✔${RESET}  $1"; }
log_info()    { echo -e "  ${CYAN}→${RESET}  $1"; }
log_warn()    { echo -e "  ${YELLOW}⚠${RESET}  $1"; }
log_error()   { echo -e "  ${RED}✖${RESET}  $1"; }

# ── Banner ─────────────────────────────────────────────────────────────────────
clear
echo -e "${BOLD}${CYAN}"
echo "  ╔═══════════════════════════════════════════════════╗"
echo "  ║            Arcanum — Server Setup                 ║"
echo "  ║            Ubuntu 22.04 LTS · Next.js 14          ║"
echo "  ╚═══════════════════════════════════════════════════╝"
echo -e "${RESET}"
echo -e "  Dieses Skript installiert und konfiguriert alles"
echo -e "  Erforderliche für den Produktivbetrieb.\n"

# ── Root-Check ─────────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  log_error "Bitte als root ausführen: sudo bash setup.sh"
  exit 1
fi

# ── Interaktive Eingaben ───────────────────────────────────────────────────────
log_section "Konfiguration"

prompt() {
  local var="$1" label="$2" default="$3" secret="$4"
  local input=""
  if [[ "$secret" == "yes" ]]; then
    read -rsp "  ${CYAN}${label}${RESET}: " input
    echo ""
  else
    if [[ -n "$default" ]]; then
      read -rp "  ${CYAN}${label}${RESET} [${default}]: " input
      input="${input:-$default}"
    else
      read -rp "  ${CYAN}${label}${RESET}: " input
    fi
  fi
  printf -v "$var" '%s' "$input"
}

echo -e "  Bitte die folgenden Werte eingeben:\n"

prompt DOMAIN          "Domain (z.B. meine-domain.de)"       ""              "no"
prompt DB_PASS         "PostgreSQL Passwort (neu generieren)" "$(openssl rand -hex 16)" "no"
prompt ADMIN_PATH      "Admin-URL-Pfad (geheim halten!)"      "$(openssl rand -hex 6)"  "no"
prompt ADMIN_EMAIL     "Admin E-Mail-Adresse"                 ""              "no"
prompt ADMIN_PASSWORD  "Admin Passwort (min. 12 Zeichen)"     ""              "yes"

# Passwort-Mindestanforderungen prüfen
if [[ ${#ADMIN_PASSWORD} -lt 12 ]]; then
  log_error "Admin-Passwort muss mindestens 12 Zeichen haben."
  exit 1
fi

prompt RESEND_KEY "Resend API-Key (leer lassen = E-Mail deaktiviert)" "" "no"
prompt EMAIL_FROM "Absender-Adresse"  "kontakt@${DOMAIN}" "no"
prompt ADMIN_NOTIFY_EMAIL "E-Mail für Anfrage-Benachrichtigungen" "${ADMIN_EMAIL}" "no"

WITH_SSL=""
read -rp "  ${CYAN}SSL-Zertifikat jetzt einrichten? (j/n)${RESET} [j]: " WITH_SSL
WITH_SSL="${WITH_SSL:-j}"

echo ""
echo -e "  ${BOLD}Zusammenfassung:${RESET}"
echo -e "  Domain:      ${DOMAIN}"
echo -e "  Admin-URL:   /${ADMIN_PATH}/login"
echo -e "  Admin-Mail:  ${ADMIN_EMAIL}"
echo -e "  SSL:         ${WITH_SSL}"
echo ""
read -rp "  ${YELLOW}Fortfahren? (j/n)${RESET} [j]: " CONFIRM
CONFIRM="${CONFIRM:-j}"
if [[ "$CONFIRM" != "j" && "$CONFIRM" != "J" ]]; then
  echo "  Abgebrochen."
  exit 0
fi

# ── Konstanten ─────────────────────────────────────────────────────────────────
APP_DIR="/var/www/offmarketdealer"
UPLOAD_DIR="/var/www/offmarketdealer-uploads"
REPO_URL="https://github.com/razer987/offmarketdealer.git"
DB_NAME="offmarketdealer"
DB_USER="omdealer"
NGINX_CONF="/etc/nginx/sites-available/offmarketdealer"
NODE_VERSION="22"

# ── System aktualisieren ───────────────────────────────────────────────────────
log_section "1/8 · System aktualisieren"
apt-get update -qq
apt-get upgrade -y -qq
log_ok "System aktuell"

# ── Node.js installieren ───────────────────────────────────────────────────────
log_section "2/8 · Node.js ${NODE_VERSION} installieren"
if command -v node &>/dev/null && [[ "$(node -v | cut -d. -f1 | tr -d 'v')" -ge "$NODE_VERSION" ]]; then
  log_ok "Node.js $(node -v) bereits installiert"
else
  log_info "NodeSource-Repository einrichten..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash - -qq
  apt-get install -y -qq nodejs
  log_ok "Node.js $(node -v) installiert"
fi

# ── PostgreSQL installieren ────────────────────────────────────────────────────
log_section "3/8 · PostgreSQL installieren"
if dpkg -l postgresql &>/dev/null; then
  log_ok "PostgreSQL bereits installiert"
else
  apt-get install -y -qq postgresql postgresql-contrib
  systemctl enable --now postgresql
  log_ok "PostgreSQL installiert und gestartet"
fi

log_info "Datenbank und Benutzer anlegen..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" -q
sudo -u postgres psql -c "ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};" -q
log_ok "Datenbank '${DB_NAME}' und Benutzer '${DB_USER}' bereit"

# ── Nginx installieren ─────────────────────────────────────────────────────────
log_section "4/8 · Nginx installieren"
if dpkg -l nginx &>/dev/null; then
  log_ok "Nginx bereits installiert"
else
  apt-get install -y -qq nginx
  systemctl enable --now nginx
  log_ok "Nginx installiert und gestartet"
fi

# ── PM2 und Certbot installieren ───────────────────────────────────────────────
log_section "5/8 · PM2 & Certbot installieren"
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2 --quiet
  log_ok "PM2 installiert"
else
  log_ok "PM2 $(pm2 -v) bereits installiert"
fi

if [[ "$WITH_SSL" == "j" || "$WITH_SSL" == "J" ]]; then
  if ! command -v certbot &>/dev/null; then
    apt-get install -y -qq certbot python3-certbot-nginx
    log_ok "Certbot installiert"
  else
    log_ok "Certbot bereits installiert"
  fi
fi

# ── Repository klonen ──────────────────────────────────────────────────────────
log_section "6/8 · App deployen"

mkdir -p "${UPLOAD_DIR}"
chmod 750 "${UPLOAD_DIR}"

if [[ -d "${APP_DIR}/.git" ]]; then
  log_info "Repository bereits vorhanden — aktualisiere..."
  git -C "${APP_DIR}" pull --ff-only
else
  log_info "Repository klonen..."
  git clone "${REPO_URL}" "${APP_DIR}"
fi
log_ok "Code in ${APP_DIR}"

cd "${APP_DIR}"

# ── Secrets generieren ─────────────────────────────────────────────────────────
log_info "Kryptografische Secrets generieren..."
JWT_ACCESS_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_ADMIN_SECRET=$(openssl rand -base64 64 | tr -d '\n')
CSRF_SECRET=$(openssl rand -base64 32 | tr -d '\n')
log_ok "Secrets generiert"

# ── .env.local erstellen ───────────────────────────────────────────────────────
log_info "Umgebungsvariablen schreiben (.env.local)..."
cat > "${APP_DIR}/.env.local" <<ENV
# Automatisch generiert von setup.sh — $(date '+%Y-%m-%d %H:%M:%S')

# Database
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

# JWT Secrets
JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
JWT_ADMIN_SECRET="${JWT_ADMIN_SECRET}"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# CSRF
CSRF_SECRET="${CSRF_SECRET}"

# Bcrypt
BCRYPT_ROUNDS="12"

# Admin
ADMIN_PATH_SECRET="${ADMIN_PATH}"
ADMIN_INITIAL_EMAIL="${ADMIN_EMAIL}"
ADMIN_INITIAL_PASSWORD="${ADMIN_PASSWORD}"
ADMIN_EMAIL="${ADMIN_NOTIFY_EMAIL}"

# Email (Resend)
EMAIL_FROM="${EMAIL_FROM}"
RESEND_API_KEY="${RESEND_KEY}"

# File uploads
UPLOAD_DIR="${UPLOAD_DIR}"
MAX_FILE_SIZE_MB="10"

# Security
ALLOWED_ORIGINS="https://${DOMAIN}"
RATE_LIMIT_LOGIN_MAX="5"
RATE_LIMIT_LOGIN_WINDOW_MIN="15"

# App
NEXT_PUBLIC_APP_URL="https://${DOMAIN}"
NODE_ENV="production"
ENV
chmod 600 "${APP_DIR}/.env.local"
log_ok ".env.local erstellt (nur root lesbar)"

# ── npm install + Prisma + Build ───────────────────────────────────────────────
log_info "Abhängigkeiten installieren (npm ci)..."
npm ci --prefer-offline 2>&1 | tail -3

log_info "Prisma Client generieren..."
npx prisma generate --schema="${APP_DIR}/prisma/schema.prisma"

log_info "Datenbankmigrationen anwenden..."
npx prisma migrate deploy --schema="${APP_DIR}/prisma/schema.prisma"

log_info "Admin-Account anlegen..."
npm run prisma:seed

log_info "Next.js Produktions-Build erstellen (kann einige Minuten dauern)..."
npm run build 2>&1 | tail -5
log_ok "Build erfolgreich"

# ── Nginx konfigurieren ────────────────────────────────────────────────────────
log_section "7/8 · Nginx konfigurieren"
cat > "${NGINX_CONF}" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 15M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/offmarketdealer
# Default-Seite deaktivieren falls aktiv
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
log_ok "Nginx konfiguriert und neu geladen"

# ── PM2 starten ────────────────────────────────────────────────────────────────
log_section "8/8 · App mit PM2 starten"

# Alte Instanz stoppen falls vorhanden
pm2 delete offmarketdealer 2>/dev/null || true

pm2 start "${APP_DIR}/pm2.config.js" --env production
pm2 save
log_ok "App läuft unter PM2 (Cluster-Modus)"

# PM2 Autostart
PM2_STARTUP_CMD=$(pm2 startup | grep "sudo env" || true)
if [[ -n "$PM2_STARTUP_CMD" ]]; then
  eval "$PM2_STARTUP_CMD"
  log_ok "PM2 Autostart aktiviert"
fi

# ── SSL einrichten ─────────────────────────────────────────────────────────────
if [[ "$WITH_SSL" == "j" || "$WITH_SSL" == "J" ]]; then
  log_section "Bonus · SSL-Zertifikat (Let's Encrypt)"
  log_info "Certbot läuft — DNS muss bereits auf diesen Server zeigen!"
  if certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" --non-interactive --agree-tos \
       --email "${ADMIN_EMAIL}" --redirect 2>&1 | tail -5; then
    log_ok "SSL-Zertifikat eingerichtet — HTTPS aktiv"
    systemctl reload nginx
  else
    log_warn "SSL-Einrichtung fehlgeschlagen. Manuell nachholen:"
    echo -e "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
  fi
fi

# ── Abschlusszusammenfassung ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔═══════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║           ✔  Installation abgeschlossen!          ║${RESET}"
echo -e "${BOLD}${GREEN}╚═══════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${BOLD}  Zugangsdaten & URLs:${RESET}"
echo -e "  Frontend:     https://${DOMAIN}"
echo -e "  Admin-Panel:  https://${DOMAIN}/${ADMIN_PATH}/login"
echo -e "  Admin-E-Mail: ${ADMIN_EMAIL}"
echo ""
echo -e "${BOLD}  Wichtige Befehle:${RESET}"
echo -e "  pm2 status               → App-Status"
echo -e "  pm2 logs offmarketdealer → Live-Logs"
echo -e "  pm2 restart offmarketdealer → Neu starten"
echo ""
echo -e "${BOLD}  App aktualisieren (Updates einspielen):${RESET}"
echo -e "  cd ${APP_DIR} && git pull"
echo -e "  npm ci && npm run build"
echo -e "  npx prisma migrate deploy"
echo -e "  pm2 restart offmarketdealer"
echo ""
echo -e "${YELLOW}  Hinweis: .env.local enthält alle Secrets.${RESET}"
echo -e "${YELLOW}  Bitte sichern: cat ${APP_DIR}/.env.local${RESET}"
echo ""
