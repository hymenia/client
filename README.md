![The Hymenia Banner](https://hymenia.dotun.cc/ghbanner.png)

# Hymenia Client

The official SvelteKit client for Hymenia, a chat and VoIP platform.

## Requirements

- Node.js 18 or newer
- pnpm 12

## Setup

Start the dev server:

```sh
pnpm i
pnpm dev
```
Build for production/deployment:

```sh
pnpm build
pm2 restart hymenia-client # if using pm2
```

## Environment

Copy `.env.example` to `.env` when the api lives somewhere else or the server
runs on a different port:

```sh
PUBLIC_API_URL=https://api.example.com
PUBLIC_WS_URL=wss://api.example.com
PUBLIC_HCAPTCHA_SITEKEY=your-public-hcaptcha-site-key
```

`PUBLIC_WS_URL` is optional, it follows `PUBLIC_API_URL` when left out. When
the server `PORT` is not 9070, set the matching port:

```sh
PUBLIC_API_PORT=9080
```

`PUBLIC_HCAPTCHA_SITEKEY` is optional. When it is omitted, hCaptcha is disabled in the login form.

## Commands

```sh
pnpm dev       # Start the development server
pnpm sync      # Regenerate SvelteKit types and route data
pnpm build     # Create a production build
pnpm preview   # Preview the production build locally
```

## Desktop app

The desktop app uses Tauri 2. Follow
the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/), and any other instruction on the site.

```sh
pnpm tauri:dev    # Start the desktop app with the Vite dev server
pnpm tauri:build  # Build desktop installers for the current platform
```

The desktop client connects to `http://localhost:9070` by default. For a remote
server, set `PUBLIC_API_URL` and optionally `PUBLIC_WS_URL` in the client `.env`
before building. Those public URLs are included in the desktop app at build time.

## Mobile apps

Tauri can package this client for Android. Initialize the Android project from
the client folder:

```sh
pnpm tauri:android:init
```
See the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for the
full setup.

Run or build for an Android device or emulator:

```sh
pnpm tauri:android:dev
pnpm tauri:android:build
```
> I don't plan on adding iOS support as I don't have access to a Mac. I need one in order to build an iOS app.

Set `PUBLIC_API_URL` in `.env` to an API address the phone can reach before
running or building the mobile app. For a phone on the same network during
development, use the computer's LAN address with HTTPS, for example
`https://192.168.1.20:9070`. Android blocks plain HTTP by default. Set
`PUBLIC_WS_URL` too if the WebSocket uses a different host. These values are
baked into the app at build time; `localhost` on a phone points to the phone
itself.

Android emulators can use the default slocalhost setup; physical Android devices
need an API URL reachable on the local network.

## License

Hymenia Client is free and open source software released under the [MIT License](LICENSE).
