# React Frontend Example

This single-page application built with React, Vite, and Bootstrap demonstrates dynamic forms and interactive BPMN process maps.

## Features
- **JSON Schema Forms**: Dynamically compiles input forms using `@rjsf/core` directly from backend schemas.
- **Process List & Actions**: Displays pending human tasks and triggers new BPMN instances.
- **BPMN visualizer widget**: Renders process progress flow inside an iframe. Highlights active nodes and completed branches.

## Setup
```bash
npm install
```

## Running Development Server
```bash
npm run dev
```
Make sure the `typescript-backend` is running on port 4000.
