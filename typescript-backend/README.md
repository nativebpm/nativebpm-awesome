# TypeScript Backend Example

This Node.js/Express server demonstrates how to integrate the `@nativebpm/sdk` package for backend workflow orchestration.

## Features
- **Process Deployments**: Automatically registers the `order-approval-flow` workflow on startup.
- **Workflow-as-Code**: Declares service tasks, user tasks, and exclusive gateways programmatically.
- **Form Schema Generation**: Serves dynamic JSON Schemas for active User Tasks.
- **Process Visualization**: Exposes endpoints to retrieve live process maps with highlighted execution tokens using `client.instances().getVisualizationHTML()`.

## Installation
```bash
npm install
```

## Running the Server
```bash
npm run dev
```
The server will start on `http://localhost:4000`.
