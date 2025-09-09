# Websolut Desktop App

An Electron application with Vue and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Development

```bash
npm run dev
```

You can also launch the app in production mode, like so

```bash
npm run start
```

## Build

```bash
# For windows
npm run build:win

# For macOS
npm run build:mac

# For Linux
npm run build:linux
```

### Debug

1. In terminal type

```bash
lldb apps/desktop/dist/mac-arm64/websolut-desktop.app
```

2. In the opened debugger type ```run --remote-debugging-port=8315```
It should open a window of your app.

3. Open Chrome at http://localhost:8315/

4. Click on the name of the app. For example "Electron".

## Notes

This project was built using the commands

```bash
npm i electron-vite -D
```

```bash
npm create @quick-start/electron@latest
```
