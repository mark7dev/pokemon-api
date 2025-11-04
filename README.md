# Pokémon Backend API

REST API built with Node.js + Express + TypeScript to fetch Pokémon from PokeAPI.

## Requirements
- Node.js >= 18
- npm >= 9

## Installation
```bash
npm install
```

## Environment variables
Create a `.env` file (optional) or export variables in your environment. Sensible defaults are set in code.

- FRONTEND_URL: Single allowed CORS origin (e.g., `http://localhost:5173`).
- FRONTEND_URLS: Comma-separated list of allowed CORS origins.
- ALLOW_NO_ORIGIN: `true|false`. Allow requests without Origin header (e.g., Postman) when `true`.
- ALLOW_LOCALHOST: `true|false`. Allow `http(s)://localhost[:port]`.
- POKEAPI_BASE: PokeAPI base URL. Default `https://pokeapi.co/api/v2`.
- CACHE_TTL: In-memory cache TTL in ms. Default `600000` (10 min).
- BATCH_SIZE: Batch size to fetch Pokémon details. Default `50`.
- AXIOS_TIMEOUT_MS: Request timeout in ms. Default `10000`.

Example `.env`:
```env
FRONTEND_URL=http://localhost:5173
# FRONTEND_URLS=http://localhost:5173,https://myapp.com
ALLOW_NO_ORIGIN=true
ALLOW_LOCALHOST=true
POKEAPI_BASE=https://pokeapi.co/api/v2
CACHE_TTL=600000
BATCH_SIZE=50
AXIOS_TIMEOUT_MS=10000
```

## Scripts
```bash
# Development (nodemon according to current project setup)
npm run dev

# Development (optional original flag)
npm run dev:api

# Build to ./dist
npm run build

# Run from dist
npm start

# Tests (Jest + ts-jest + supertest)
npm test
npm run test:watch

# Lint (ESLint flat config CJS)
npm run lint
npm run lint:fix

# Format (Prettier)
npm run format
npm run format:check
```

## Endpoints
- GET `/api/pokemons`
  - Returns a list of Pokémon DTOs:
    ```json
    [{
      "name": "bulbasaur",
      "types": ["grass", "poison"],
      "image": "https://.../bulbasaur.png"
    }]
    ```
  - Response may be served from in-memory cache according to `CACHE_TTL`.

## Architecture
- `src/server.ts`: Sets up Express, CORS, logging, JSON, routes, and error middleware.
- `src/index.ts`: Entry point; starts the server.
- `src/routes/pokemonRouter.ts`: Pokémon routes.
- `src/controllers/pokemonController.ts`: Pokémon controller.
- `src/services/pokemonService.ts`: PokeAPI access, caching, and DTO mapping.
- `src/middleware/errorHandler.ts`: Unified error handling (Axios/AppError/unexpected errors).
- `src/utils/axiosError.ts`: Helper to map errors to `AppError`.
- `src/interfaces/*`: Pokémon types/DTOs.

## CORS
Configure allowed origins via `FRONTEND_URL`/`FRONTEND_URLS`. You can also allow clients without `Origin` (`ALLOW_NO_ORIGIN`) or `localhost` (`ALLOW_LOCALHOST`). Adjust variables for development/production as needed.

## Testing
- Integration: `src/__tests__/pokemonController.int.test.ts` uses `supertest` with axios mocks to validate `/api/pokemons`.
- Unit: `src/__tests__/pokemonService.test.ts` validates caching and content without assuming order.
- Unit: `src/__tests__/errorHandler.test.ts` validates error handler responses.

## Performance notes
- Batched detail fetches (`BATCH_SIZE`) reduce pressure on PokeAPI.
- In-memory cache governed by `CACHE_TTL`.
- Consider adding retries with backoff and a concurrency limiter if you expect rate limiting.

## Code style
- ESLint (flat config in `eslint.config.cjs`) and Prettier.
- Run `npm run lint` and `npm run format` before committing.

## Deployment
- Build with `npm run build`.
- Set environment variables (CORS, TTL, etc.).
- Run with `node dist/index.js` or the provided `npm start`.

## Continuous Integration (CI)
This repo includes a GitHub Actions workflow that runs on every push and pull request:

- Installs dependencies with npm cache
- Runs ESLint (`npm run lint`)
- Runs tests in CI mode (`npm test -- --ci`)

Workflow file: `.github/workflows/ci.yml`

You can add a status badge to this README by replacing `OWNER` and `REPO`:

```
![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)
```


