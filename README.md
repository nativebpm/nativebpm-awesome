# NativeBPM Awesome Examples (`nativebpm-awesome`)

This repository contains real-world, production-ready implementation examples demonstrating how to use the 10 NativeBPM Client SDKs across various languages and UI frameworks.

---

## 🚀 Projects Overview

| Directory | Language / Framework | Description |
| :--- | :--- | :--- |
| [`typescript-backend/`](./typescript-backend) | TypeScript (Node/Express) | Orchestrates BPMN flows, returns dynamic JSON Schema Forms. |
| [`frontend-react/`](./frontend-react) | React (Vite / RJSF) | Dynamically renders JSON Schema Forms and hosts the **interactive BPMN Process Visualization**. |
| [`frontend-vue/`](./frontend-vue) | Vue 3 (Vite) | Renders dynamic reactive fields from BPMN JSON Schemas and embeds the process visualization. |
| [`flutter-mobile-client/`](./flutter-mobile-client) | Dart / Flutter | Mobile interface for warehouse managers to claim, review, and complete User Tasks. |
| [`go-ecommerce/`](./go-ecommerce) | Go (Gin) | Webhook server parsing HMAC signatures (`X-NativeBPM-Signature`) on execution events. |
| [`python-ai-worker/`](./python-ai-worker) | Python | Long-polling worker executing AI Agent reviews using LLMs and completing service tasks. |
| [`rust-cli/`](./rust-cli) | Rust (Clap / Tokio) | Command-line tool to compile, validate, and deploy BPMN XML definitions to the engine. |
| [`java-loan-pipeline/`](./java-loan-pipeline) | Java (Spring Boot) | Initiates financial loan approvals and routes instances via the Java SDK. |
| [`dotnet-leave-requests/`](./dotnet-leave-requests) | C# (.NET Core) | Web API project orchestrating employee vacation requests. |
| [`php-doc-approval/`](./php-doc-approval) | PHP (Composer) | Handles business document approvals using the PHP client wrapper. |
| [`kotlin-warehouse/`](./kotlin-warehouse) | Kotlin (JVM) | Stock picking worker console application claiming tasks and updating payloads. |

---

## 🎨 Features & Highlights

### 1. BPMN Process Visualization
All UI frontends (React and Vue) support embedding the NativeBPM process visualization widget:
- Fetches live layout and status via the SDK (`client.instances().getVisualizationHTML()`).
- Highlights completed elements, active elements, and token states with interactive CSS.
- Automatically falls back to an SVG-rendered simulation if the local engine is offline.

### 2. Declarative Form Generation
Forms are dynamically compiled directly from the BPMN definitions using JSON Schema, avoiding client-side state creep:
- React client uses `@rjsf/core` to parse and render inputs.
- Vue client implements a reactive schema parser translating fields dynamically.

---

## 🛠 Running the Examples

### TypeScript Stack (Backend + React + Vue)
1. **Start the backend**:
   ```bash
   cd typescript-backend
   npm install
   npm run dev # Starts on http://localhost:4000
   ```
2. **Start the React frontend**:
   ```bash
   cd frontend-react
   npm install
   npm run dev
   ```
3. **Start the Vue frontend**:
   ```bash
   cd frontend-vue
   npm install
   npm run dev
   ```

### Go E-Commerce Webhook Server
```bash
cd go-ecommerce
go mod tidy
go run main.go
```

### Python AI Agent Worker
```bash
cd python-ai-worker
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Rust CLI
```bash
cd rust-cli
cargo run -- --file path/to/process.bpmn
```
