# Medusa Backend Server

This is the backend server for the Medusa commerce application. 

## Features & Custom Modules

- **Point of Sale (POS) Module**: Full shift management, registers, session tracking, and financial X/Z reporting.
  - 📖 [Read the POS Architecture & API Docs](src/modules/pos/README.md)
- **Store & Admin POS API Routes**: Custom endpoints exposing POS actions to the frontend POS client and Medusa Admin dashboard.
- **Transactional Workflows**: Workflows built on Medusa v2 Workflow SDK for reliable register and session state changes.

## Getting Started

To run the server locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

For more details on the underlying framework, see the [Medusa Documentation](https://docs.medusajs.com).
