# Off-Market Automobiles

Private Plattform für diskrete Vermittlung von exklusiven Fahrzeugen im Einladungsmodell.
Entwickelt mit Next.js 14, PostgreSQL, Prisma und Tailwind CSS.

---

## Inhaltsverzeichnis

1. [Lokale Entwicklung](#1-lokale-entwicklung)
2. [Produktiv-Deployment auf Ubuntu-Server](#2-produktiv-deployment-auf-ubuntu-server)
3. [Umgebungsvariablen](#3-umgebungsvariablen)
4. [Nützliche Befehle](#4-nützliche-befehle)

---

## 1. Lokale Entwicklung

### Voraussetzungen

- **Node.js 22 LTS** — [nodejs.org](https://nodejs.org) oder via nvm:
  ```bash
  nvm install 22 && nvm use 22
  ```
- **PostgreSQL 15+**
  ```bash
  # Ubuntu/Debian
  sudo apt install postgresql postgresql-contrib
  sudo systemctl start postgresql

  # macOS (Homebrew)
  brew install postgresql@15 && brew services start postgresql@15
  ```

### Datenbank anlegen

```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE offmarketdealer;
CREATE USER omdealer WITH PASSWORD 'sicheres_passwort';
GRANT ALL PRIVILEGES ON DATABASE offmarketdealer TO omdealer;
\q
```

### Projekt einrichten

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen anlegen
cp .env.example .env.local
# Datei öffnen und alle Werte ausfüllen (siehe Abschnitt 3)

# 3. Datenbank migrieren
npx prisma migrate dev

# 4. Initialen Admin-Account anlegen
npm run prisma:seed

# 5. Entwicklungsserver starten
npm run dev
```

Die App ist jetzt erreichbar unter:
- **Frontend:** http://localhost:3000
- **Admin-Panel:** http://localhost:3000/`{ADMIN_PATH_SECRET}`/login

> `ADMIN_PATH_SECRET` ist der Wert aus `.env.local` (Standard: `admin-panel`).
> Für den Login werden die Zugangsdaten aus `ADMIN_INITIAL_EMAIL` / `ADMIN_INITIAL_PASSWORD` verwendet.

---

## 2. Produktiv-Deployment auf Ubuntu-Server

### 2.1 Serverpaket installieren

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js 22 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql

# Nginx (Reverse Proxy)
sudo apt install -y nginx
sudo systemctl enable --now nginx

# PM2 (Prozessmanager)
sudo npm install -g pm2

# Certbot (Let's Encrypt SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### 2.2 Datenbank anlegen

```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE offmarketdealer;
CREATE USER omdealer WITH PASSWORD 'SEHR_SICHERES_PASSWORT';
GRANT ALL PRIVILEGES ON DATABASE offmarketdealer TO omdealer;
\q
```

### 2.3 App deployen

```bash
# Repository klonen
cd /var/www
sudo git clone https://github.com/razer987/offmarketdealer.git
sudo chown -R $USER:$USER offmarketdealer
cd offmarketdealer

# Upload-Verzeichnis außerhalb des Web-Roots anlegen
sudo mkdir -p /var/www/offmarketdealer-uploads
sudo chown $USER:$USER /var/www/offmarketdealer-uploads

# Abhängigkeiten für Produktion installieren
npm ci

# Umgebungsvariablen konfigurieren
cp .env.example .env.local
nano .env.local
```

Wichtige Werte für Produktion:
```
DATABASE_URL=postgresql://omdealer:SEHR_SICHERES_PASSWORT@localhost:5432/offmarketdealer
NEXT_PUBLIC_APP_URL=https://ihre-domain.de
ALLOWED_ORIGINS=https://ihre-domain.de
NODE_ENV=production
UPLOAD_DIR=/var/www/offmarketdealer-uploads
ADMIN_PATH_SECRET=ihr-geheimer-pfad   # Niemals "admin-panel" lassen!
```

JWT-Secrets sicher generieren:
```bash
openssl rand -base64 64   # Dreimal ausführen für ACCESS / REFRESH / ADMIN Secret
```

```bash
# Prisma Client generieren und Migrationen anwenden
npx prisma generate
npx prisma migrate deploy

# Admin-Account anlegen
npm run prisma:seed

# Produktions-Build erstellen
npm run build

# App mit PM2 starten
pm2 start pm2.config.js --env production
pm2 save

# Autostart bei Serverneustart aktivieren
pm2 startup
# Den angezeigten sudo-Befehl kopieren und ausführen!
```

### 2.4 Nginx konfigurieren

```bash
sudo nano /etc/nginx/sites-available/offmarketdealer
```

Inhalt:
```nginx
server {
    listen 80;
    server_name ihre-domain.de www.ihre-domain.de;

    # Upload-Limit
    client_max_body_size 15M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/offmarketdealer /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 2.5 SSL-Zertifikat einrichten

```bash
sudo certbot --nginx -d ihre-domain.de -d www.ihre-domain.de
```

Certbot ergänzt die Nginx-Konfiguration automatisch um HTTPS-Weiterleitung.

### 2.6 App aktualisieren (Updates einspielen)

```bash
cd /var/www/offmarketdealer
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 restart offmarketdealer
```

---

## 3. Umgebungsvariablen

Alle Variablen in `.env.local` (niemals ins Git committen!):

| Variable | Beschreibung | Beispielwert |
|----------|--------------|--------------|
| `DATABASE_URL` | PostgreSQL-Verbindungsstring | `postgresql://omdealer:pw@localhost:5432/offmarketdealer` |
| `JWT_ACCESS_SECRET` | Secret für Access-Token (15 min) | `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | Secret für Refresh-Token (7 Tage) | `openssl rand -base64 64` |
| `JWT_ADMIN_SECRET` | Secret für Admin-Token (30 min) | `openssl rand -base64 64` |
| `CSRF_SECRET` | CSRF-Schutz | `openssl rand -base64 32` |
| `ADMIN_PATH_SECRET` | Geheimer URL-Pfad für Admin | z.B. `geheim-8f3a2b` |
| `ADMIN_INITIAL_EMAIL` | E-Mail des ersten Admin-Accounts | `admin@domain.de` |
| `ADMIN_INITIAL_PASSWORD` | Passwort des ersten Admin-Accounts (min. 12 Zeichen, Groß/Klein/Zahl/Sonderzeichen) | |
| `ADMIN_EMAIL` | Wohin Anfrage-Benachrichtigungen gehen | `sascha@domain.de` |
| `RESEND_API_KEY` | API-Key von resend.com | `re_...` |
| `EMAIL_FROM` | Absenderadresse | `kontakt@domain.de` |
| `UPLOAD_DIR` | Absoluter Pfad für Fahrzeugbilder (außerhalb Web-Root!) | `/var/www/uploads` |
| `NEXT_PUBLIC_APP_URL` | Öffentliche App-URL | `https://ihre-domain.de` |
| `ALLOWED_ORIGINS` | CORS-Whitelist | `https://ihre-domain.de` |
| `NODE_ENV` | Umgebung | `production` |

---

## 4. Nützliche Befehle

```bash
# Entwicklung
npm run dev              # Entwicklungsserver auf Port 3000
npm run build            # Produktions-Build
npm test                 # Unit-Tests ausführen (42 Tests)
npm run test:coverage    # Tests mit Coverage-Report

# Datenbank
npx prisma studio        # Datenbank-Browser im Web
npx prisma migrate dev   # Neue Migration erstellen (Entwicklung)
npx prisma migrate deploy # Migrationen anwenden (Produktion)
npm run prisma:seed      # Admin-Account anlegen
npm run prisma:generate  # Prisma-Client neu generieren

# PM2 (Produktion)
pm2 status               # App-Status anzeigen
pm2 logs offmarketdealer # Live-Logs anzeigen
pm2 restart offmarketdealer # App neu starten
pm2 stop offmarketdealer    # App stoppen
```

---

## Architektur-Überblick

```
src/
├── app/
│   ├── (public)/          # Öffentliche Seiten (Landing, Login, Teaser)
│   ├── (members)/         # Mitglieder-Bereich (geschützt, JWT erforderlich)
│   ├── (admin)/           # Admin-Panel (geschützt, Admin-JWT + TOTP)
│   ├── (admin-public)/    # Admin-Login (außerhalb Auth-Layout)
│   └── api/               # API-Routen
├── lib/
│   ├── auth/              # JWT, Passwort, Session, Rate-Limiting, TOTP
│   ├── db/                # Prisma-Client
│   ├── email/             # E-Mail-Templates (Resend)
│   ├── images/            # Bild-Upload (Sharp, EXIF-Strip)
│   └── utils/             # Fehlerbehandlung, Validierung
prisma/
├── schema.prisma          # Datenbankschema
└── seed.ts                # Admin-Account anlegen
tests/
└── unit/                  # 42 Unit-Tests (Jest)
```
