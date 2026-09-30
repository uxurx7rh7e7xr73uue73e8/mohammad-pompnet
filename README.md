# Mohammad PompNet

This repository contains a production-ready web panel based on the concepts and functionality of Sanaei 3x-ui, rebranded as PompNet with a Persian RTL UI and Railway-ready deployment architecture.

Important: this project is designed to preserve real data and avoid destructive changes. If you are adapting an existing Sanaei installation, keep the original database, users, inbounds, Xray config, and working data intact. Do not remove or reset the existing installation.

## Project Structure

- `frontend/` – React + Vite admin panel UI
- `backend/` – Express + Prisma + PostgreSQL API
- `Dockerfile` – production container build
- `docker-compose.yml` – local container orchestration
- `.env.example` – environment variable template

## Branding

- Name: محمد پمپ نت
- Brand: PompNet
- Tagline: PompNet | Fast • Secure • Unlimited
- UI colors: dark black, neon blue, neon purple, glassmorphism
- Locale: Persian RTL

## Railway Port Behavior

The panel must bind to the port assigned by Railway. In production, Railway sets `PORT` automatically. The app should listen on:

- `0.0.0.0`
- `process.env.PORT || 8080`

Example:

- Local dev: `PORT=8080` or `PORT=8000`
- Railway: `PORT=8080` or any assigned dynamic port

This means the app is not hardcoded to only run on 80/8080 or 8000. It uses the environment variable from Railway or local deployment.

For local testing, you can run the app on port 8080 or 8000. For Railway, do not force a hardcoded port. The service will use the runtime-provided `$PORT`.

## Quick Start

### 1) Clone repository

```bash
git clone https://github.com/your-user/mohammad-pompnet.git
cd mohammad-pompnet
```

### 2) Configure environment

```bash
cp .env.example .env
```

Then update values for your environment.

### 3) Start with Docker Compose

```bash
docker compose up --build
```

Then open:

- Local app: `http://localhost:8080`
- Local API: `http://localhost:8080/api/health`

## Railway Deployment

### 1) Push to GitHub

```bash
git init
git add .
git commit -m "Initial PompNet panel"
git branch -M main
git remote add origin https://github.com/<your-user>/<repo>.git
git push -u origin main
```

### 2) Connect GitHub to Railway

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project"
4. Choose "Deploy from GitHub repo"
5. Select your repo
6. Choose the repository containing this project

### 3) Create the Railway service

1. Select the repo
2. Railway will detect the Dockerfile
3. Keep the service using the default Docker build
4. Add a PostgreSQL service in the same project

### 4) Configure environment variables

In Railway Project Settings -> Variables, add:

- `PORT` = `8080` or leave blank to use Railway dynamic port
- `HOST` = `0.0.0.0`
- `NODE_ENV` = `production`
- `JWT_SECRET` = strong random secret
- `CORS_ORIGIN` = your Railway domain or wildcard for testing
- `DATABASE_URL` = PostgreSQL connection URL from Railway PostgreSQL service
- `ADMIN_USERNAME` = admin
- `ADMIN_PASSWORD` = strong password

### 5) Create or connect PostgreSQL

1. In Railway, add "Database" -> "PostgreSQL"
2. Copy the generated `DATABASE_URL`
3. Paste it into Railway variables
4. Ensure the app uses that value via `DATABASE_URL`

### 6) Deploy

Click "Deploy" in Railway. The app will run the Dockerfile and automatically bind to Railway's `$PORT`.

### 7) Configure the Railway domain

1. Open the service settings
2. Click "Generate Domain"
3. Use the generated HTTPS domain for the panel
4. Ensure the frontend/API accepts that origin in `CORS_ORIGIN`

### 8) Health check

The project exposes:

- `/health`
- `/api/health`

Railway can use these for health checks. Example path: `/health`

### 9) Connect the VPS Agent

For a secure architecture, keep:

- Railway = web panel / frontend / API
- VPS = secure agent / API / Xray / Sanaei services

Use a secure authenticated API between Railway and the VPS. Recommended:

- Mutual TLS or signed API key
- Private network / VPN / reverse tunnel
- Do not expose unauthenticated management APIs
- Do not run privileged Xray operations inside Railway

### 10) Verify the panel is working

After deployment:

- Visit your Railway domain
- Log in using the admin account
- Check `/health` returns `ok`
- Check `/api/health` returns service status
- Verify dashboard cards load with real data
- Verify user list loads
- Verify inbounds appear

## Security Notes

- Never commit secrets to GitHub
- Use environment variables for passwords and tokens
- Hash passwords with bcrypt
- Use JWT for API authentication
- Configure HTTPS via Railway domain
- Rate limit requests and validate input
- Do not directly run system-level Xray commands on Railway

## Important Data Safety Rule

If adapting an existing Sanaei installation, do not:

- delete users
- delete inbounds
- reset database
- remove existing configurations
- wipe Xray settings

Instead:

- backup before changes
- preserve existing DB and Xray config
- rebrand frontend only when possible
- keep the original working system operational

## Support Button

The UI includes a support shortcut:

- 🛟 PompNet Support
- Telegram: @NuvoraAzad980

## License

This project is provided as a code base for deployment and customization. Use responsibly and keep production secrets out of source control.
