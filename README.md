# yamanote
山手線診断アプリ
=======
# 山手線駅診断アプリ (Yamanote Station Finder)

A diagnostic web application that recommends the best Yamanote line station based on user preferences and lifestyle.

## Project Structure

```
yamanote-station-finder/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services and utilities
│   │   ├── types/          # TypeScript type definitions
│   │   ├── App.tsx         # Main App component
│   │   └── main.tsx        # Application entry point
│   ├── package.json
│   ├── vite.config.ts      # Vite configuration
│   └── tsconfig.json       # TypeScript configuration
├── backend/                 # Express.js backend API
│   ├── src/
│   │   ├── services/       # Business logic services
│   │   ├── routes/         # API route handlers
│   │   ├── types/          # TypeScript type definitions
│   │   ├── data/           # Static data files
│   │   └── index.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json       # TypeScript configuration
└── package.json            # Root package.json with workspaces
```

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Jest** + **React Testing Library** for unit testing
- **fast-check** for property-based testing

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **CORS** for cross-origin requests
- **Jest** for unit testing
- **fast-check** for property-based testing

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies for all packages:
```bash
npm install
```

2. Install frontend dependencies:
```bash
cd frontend && npm install
```

3. Install backend dependencies:
```bash
cd backend && npm install
```

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or start them individually:
```bash
# Frontend (runs on http://localhost:3000)
npm run dev:frontend

# Backend (runs on http://localhost:3001)
npm run dev:backend
```

### Testing

Run all tests:
```bash
npm test
```

Run tests for specific packages:
```bash
npm run test:frontend
npm run test:backend
```

### Building

Build both frontend and backend:
```bash
npm run build
```

## Features

- Multi-category diagnostic questions (housing, transport, commercial, culture, price)
- Comprehensive database of all 29 Yamanote line stations
- Intelligent recommendation algorithm with scoring
- Detailed explanations for recommendations
- Responsive design for mobile and desktop
- Property-based testing for reliability

## Requirements

This application implements the requirements specified in `.kiro/specs/yamanote-station-finder/requirements.md`.