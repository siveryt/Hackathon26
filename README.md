# Hackathon26

SvelteKit + Tailwind + Drizzle (Postgres) + OSRM.

## Voraussetzungen

- [Node.js](https://nodejs.org) (LTS)
- pnpm: `npm install -g pnpm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (muss laufen)

## Starten (PowerShell)

```powershell
git clone <repo-url>
cd Hackathon26
pnpm install
copy .env.example .env
```

DB + OSRM starten (eigenes Terminal offen lassen):

```powershell
pnpm db:start
```

> Achtung: OSRM lädt beim ersten Start die Deutschland-Karte (~4 GB) und verarbeitet sie. Das dauert lange und braucht viel RAM. In Docker Desktop ggf. mehr Speicher geben.

DB-Schema pushen (einmalig bzw. nach Schema-Änderungen):

```powershell
pnpm db:push
```

Dev-Server starten:

```powershell
pnpm dev
```

→ http://localhost:5173

## Sonstiges

- `pnpm db:studio` – DB im Browser anschauen
- `pnpm check` – Typecheck
- `pnpm format` – Code formatieren
