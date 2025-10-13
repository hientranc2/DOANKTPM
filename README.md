# DOANKTPM Monorepo Quickstart

This repository contains three separate apps that work together:

- `backend/` – Express + MongoDB API server.
- `admin/` – React (Vite) admin dashboard.
- `frontend/` – React storefront built with Create React App.

Follow the steps below if you just pulled the project and want to run everything locally without copying files around manually.

## 1. Clone or update the repository

```bash
# clone once
git clone https://github.com/hientranc2/DOANKTPM.git
cd DOANKTPM

# or, if you already have a clone, just pull the latest changes
git pull
```

> ✅ Using `git clone`/`git pull` is the easiest way to get every file at once—no need to download them one by one.

## 2. Install dependencies for each app (one time)

From the repository root run:

```bash
# install backend dependencies
npm install --prefix backend

# install admin dependencies
npm install --prefix admin

# install storefront dependencies
npm install --prefix frontend
```

> You only need to reinstall when `package.json` changes. Otherwise you can skip this step on subsequent runs.

## 3. Start the services

Open three terminals (or use tools like `tmux`) and run one command per terminal:

```bash
# terminal 1 – API server
npm start --prefix backend  # or: node index.js

# terminal 2 – admin dashboard (Vite)
npm run dev --prefix admin

# terminal 3 – storefront (CRA)
npm start --prefix frontend
```

Each application uses its own dev server, so keep the terminals running while you work.

### Optional: launch everything from one script

If you prefer a single command, you can use the provided helper script:

```bash
./scripts/dev-all.sh
```

It will spawn three background processes (backend, admin, storefront) and tail their output. Press <kbd>Ctrl+C</kbd> to stop them all at once.

> The script relies only on Bash—no extra Node packages are required.

## 4. Environment variables

- The backend expects the standard MongoDB connection variables (see `backend/index.js`). Create a `.env` file in `backend/` with `MONGODB_URI` and any other secrets you need.
- The frontends read their configuration from their respective `.env` files if needed (e.g. API base URL).

## Troubleshooting

- **Ports already in use** – Stop any lingering dev servers or adjust the ports in the respective configuration files.
- **Dependency errors** – Delete the relevant `node_modules/` folder and reinstall with `npm install --prefix <app>`.
- **Accessing the API** – By default the backend listens on port `4000`. Update the frontends' API URLs if you run the server on a different port.

Happy building!
