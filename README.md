# Websolut

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<!-- Change later with our Websolut banner image -->
![Websolut](/docs/assets/banner.png)

Websolut is an open-source toolkit that helps you turn your Figma designs into production-ready code.
It provides a complete development environment with a **core engine**, a **backend API**, and a **desktop app**.

---

## Features

- **Convert Figma to Production Code**
  From JSON to DOMX to any format: HTML+CSS, React, Vue, or your own templates.

- **Desktop App**
  ElectronJS app that ships with backend + configuration UIs.

- **Backend API**
  Built with NestJS, SQLite, Swagger docs, and persistence.

- **Extensible Core Engine**
  Customize your templates, integrate with frameworks, or export to custom targets.

- **Monorepo**
  Everything you need: engine, backend, and desktop — in one codebase.

---

## Download

Choose your platform:

[![Download for macOS](https://img.shields.io/badge/⬇️_Download-macOS-black?logo=apple&style=for-the-badge)](https://github.com/wsolut/websolut/releases/download/v0.2.0-alpha/websolut-0.2.0-alpha.dmg)
[![Download for Windows](https://img.shields.io/badge/⬇️_Download-Windows-blue?logo=windows&style=for-the-badge)](https://github.com/wsolut/websolut/releases/download/v0.2.0-alpha/websolut-desktop-0.2.0-alpha-setup.exe.zip)

---

## Documentation

- [Getting your **Figma Token**](docs/FIGMA_TOKEN.md)
- [Getting your **Vercel Token**](docs/VERCEL_TOKEN.md)
- [Deploying with **WordPress Plugin**](WORDPRESS.md)

---

## Overview

Websolut monorepo contains:

- **Core Engine**
  A Node.js package that converts Figma JSON data into an extended DOM format (DOMX).
  DOMX can then be rendered through your own EJS templates into any output you need:
  plain **HTML+CSS**, **React**, **Vue**, or custom frameworks.

- **Backend**
  A **NestJS REST API** that persists data in a SQLite database and interacts with the core engine.
  It also provides Swagger documentation and a SPA interface.

- **Desktop App**
  An **ElectronJS application** that launches the backend alongside two Vue.js apps:
  one for configuration and another to interact with your backend.

---

## Getting Started

### Clone the repository

```bash
git clone https://github.com/wsolut/websolut.git
cd websolut
````

### Install dependencies

```bash
npm install
```

---

## Development

### Backend Development

Run the backend locally:

```bash
npm run dev:backend
```

* **SPA**: [http://localhost:5555/spa](http://localhost:5555/spa)
* **Swagger Docs**: [http://localhost:5555/docs/v1](http://localhost:5555/docs/v1)

---

### Desktop Development

Run the desktop app in development mode:

```bash
npm run dev:desktop
```

Run the desktop app in production mode:

```bash
npm run start:desktop
```

---

## Build

### macOS

```bash
cd apps/desktop
npm run build:mac
```

The build outputs will be located at:

* **Installer**: `apps/desktop/dist/websolut-desktop-<version>.dmg`
* **Executable**: `apps/desktop/dist/<mac-platform>/websolut-desktop`

---

## Contributing

We welcome contributions to Websolut! Here's how you can help:

### Reporting Issues

1. Check existing issues to avoid duplicates
2. Create a new issue with a clear title and description
3. Include steps to reproduce the problem
4. Add relevant labels and screenshots if applicable

### Making Changes

1. **Fork the repository** and create your branch from `main`
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** and ensure they follow the existing code style
4. **Test your changes** thoroughly
5. **Commit your changes**: `git commit -m 'Add some feature'`
6. **Push to your branch**: `git push origin feature/your-feature-name`
7. **Create a Pull Request** with a clear title and description

### Pull Request Guidelines

* Reference any related issues in your PR description
* Include screenshots or GIFs for UI changes
* Make sure all tests pass
* Update documentation if needed
* Keep your commits atomic and well-documented

### Development Setup

Follow the [Getting Started](#getting-started) section to set up your local development environment.

### Code of Conduct

Please be respectful and constructive in all interactions. We're building this together!

---

## License

Websolut is open source and licensed under the [MIT License](LICENSE).
