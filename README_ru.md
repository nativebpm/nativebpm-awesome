# Примеры использования NativeBPM SDK (`nativebpm-awesome`)

В этом репозитории содержатся примеры интеграции и использования 10 клиентских SDK NativeBPM для различных языков программирования и пользовательских интерфейсов.

---

## 🚀 Обзор проектов

| Папка | Язык / Фреймворк | Описание |
| :--- | :--- | :--- |
| [`typescript-backend/`](./typescript-backend) | TypeScript (Node/Express) | Управляет BPMN-процессами на бэкенде, отдает динамические формы JSON Schema. |
| [`frontend-react/`](./frontend-react) | React (Vite / RJSF) | Рендерит динамические формы и содержит **интерактивную визуализацию BPMN-процесса**. |
| [`frontend-vue/`](./frontend-vue) | Vue 3 (Vite) | Строит реактивные формы по схемам NativeBPM и встраивает интерактивную визуализацию. |
| [`flutter-mobile-client/`](./flutter-mobile-client) | Dart / Flutter | Мобильный интерфейс для получения, захвата (claim) и завершения задач User Task. |
| [`go-ecommerce/`](./go-ecommerce) | Go (Gin) | Сервер проверки HMAC-подписей (`X-NativeBPM-Signature`) на вебхуках от движка. |
| [`python-ai-worker/`](./python-ai-worker) | Python | Воркер, опрашивающий задачи AI-агентов и завершающий их с помощью LLM-анализа. |
| [`rust-cli/`](./rust-cli) | Rust (Clap / Tokio) | CLI-утилита для локального развертывания и валидации BPMN XML-схем. |
| [`java-loan-pipeline/`](./java-loan-pipeline) | Java (Spring Boot) | Запуск кредитного скоринга и маршрутизация процесса с использованием Java SDK. |
| [`dotnet-leave-requests/`](./dotnet-leave-requests) | C# (.NET Core) | Web API для автоматизации заявок на отпуск сотрудников. |
| [`php-doc-approval/`](./php-doc-approval) | PHP (Composer) | Пример согласования финансовых документов на основе PHP-клиента. |
| [`kotlin-warehouse/`](./kotlin-warehouse) | Kotlin (JVM) | Клиентское консольное приложение для сборщика заказов на складе. |

---

## 🎨 Возможности и особенности

### 1. Визуализация BPMN-процесса
Интерфейсы на React и Vue поддерживают отображение виджета визуализации:
- Запрос HTML-представления из SDK (`client.instances().getVisualizationHTML()`).
- Отображение токенов, активных и завершенных нод.
- Встроенный fallback на `bpmn-js` при отключенном локальном движке.

### 2. Динамические формы JSON Schema
Формы генерируются на основе определений BPMN прямо с бэкенда:
- В React используется библиотека `@rjsf/core`.
- В Vue реализован собственный парсер схем.

---

## 🛠 Запуск примеров

### TypeScript стек (Бэкенд + React + Vue)
1. **Запуск бэкенда**:
   ```bash
   cd typescript-backend
   npm install
   npm run dev # Запуск на http://localhost:4000
   ```
2. **Запуск React UI**:
   ```bash
   cd frontend-react
   npm install
   npm run dev
   ```
3. **Запуск Vue UI**:
   ```bash
   cd frontend-vue
   npm install
   npm run dev
   ```

### Go E-Commerce Webhook Server
```bash
cd go-ecommerce
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
