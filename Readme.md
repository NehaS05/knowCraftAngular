# knowCraft (Angular)

**knowCraft** is an Angular-based web application for managing knowledge, user roles, analytics, audits, and chat/AI features. This repository contains the frontend implementation built with Angular (TypeScript) and follows a modular structure for scalability and maintainability. 🚀

---

## 🔧 Key Features

- Role-based authentication and guards (`core/guards`) ✅
- Auth interceptor and services (`core/interceptors`, `core/services`) 🔐
- Modules for **Analytics**, **Audit Logs**, **Chat**, **Knowledge**, **Settings**, and **User Management** (`src/app/modules`) 📦
- Shared UI components (`src/app/shared/components`) and utilities for consistent UX ✨
- Environment separation for dev/prod (`environments/`) ⚙️

---

## Prerequisites

- Node.js >= 16
- npm or yarn
- Angular CLI (optional, for local development): `npm i -g @angular/cli`

---

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

2. Run development server:

   ```bash
   npm start
   # or
   ng serve
   ```

   App will be available at http://localhost:4200

---

## Development Commands

- `npm start` / `ng serve` — Run the dev server
- `npm run build` — Build the app for production into `dist/`
- `npm test` — Run unit tests
- `npm run lint` — Lint the repository

---

## Build & Deploy

Build for production:

```bash
npm run build -- --prod
```

Example static site deploy (used in this project):

```bash
swa deploy ./dist/knowCraft \
  --deployment-token <YOUR_DEPLOY_TOKEN>
```

Replace `<YOUR_DEPLOY_TOKEN>` with your Static Web Apps deployment token.

---

## Project Structure

Key folders:

- `src/app/core/` — core services, guards, interceptors, and models
- `src/app/modules/` — feature modules (analytics, audit-logs, auth, chat, dashboard, knowledge, settings, user)
- `src/app/shared/` — shared module and reusable components (header, layout, loading, modal, sidebar, toast)
- `environments/` — `environment.ts` and `environment.prod.ts`

---

## Testing

- Unit tests are located alongside components/services (e.g., `*.spec.ts`).
- Run tests with:

```bash
npm test
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes and add tests
4. Run lint/tests locally
5. Open a pull request with a clear description

---

## Notes & Tips 💡

- Use `src/app/core/services` for application-wide services (auth, user, document, etc.).
- Keep feature-specific code within its module under `src/app/modules` for clarity.
- Ensure environment-specific settings are not committed with secrets.

---

## License

Specify your project license here (e.g., MIT). If none, add a `LICENSE` file.

---

## Contact

For questions or help, open an issue or contact the project maintainer.

---

**Happy coding!** ✨
