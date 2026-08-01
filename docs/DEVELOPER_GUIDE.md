# PragatiX Web Frontend — Developer Guide

Welcome to the PragatiX Web Frontend application developer guide. This document provides an overview of the frontend architecture, technology stack, and local development setup.

## Technology Stack
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vite.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Charting**: [Recharts](https://recharts.org/)

---

## Directory Structure
The codebase follows a feature-based architecture pattern under `src/`:
- `src/api`: Shared API clients and backend communication logic.
- `src/assets`: Static assets (images, logos, fonts).
- `src/components`:
  - `common`: Reusable presentation components (badges, modals, loaders).
  - `layout`: Base structural components (sidebar, layout shell).
- `src/config`: Base application configuration.
- `src/core`: Utility helper functions.
- `src/features`: Feature-scoped views and business logic:
  - `admin`: Academic coordination, coordination, activity creation.
  - `auth`: Login, registration, identity resolution.
  - `captain`: Captain-specific views, group actions.
  - `student`: Profile, gamification, leaderboard, badges.
  - `teacher`: Directory, activity assessment, inbox.
- `src/hooks`: Global custom React hooks.
- `src/services`: Business services interfacing with backend APIs.
- `src/store`: Global state management stores.

---

## Getting Started

### Prerequisites
- Node.js v20+
- npm v10+

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env`:
   ```env
   VITE_API_BASE_URL='http://localhost:8080'
   ```
3. Start local development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
