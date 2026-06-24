# Rust CLI Утилита Развертывания

Этот проект представляет собой консольную асинхронную утилиту на Rust для отправки и валидации BPMN 2.0 XML-схем в NativeBPM.

## Возможности
- **Асинхронность**: Построен на библиотеке `tokio` для выполнения неблокирующих сетевых запросов.
- **Парсинг Clap**: Анализ параметров `--url`, `--token` и `--file` с генерацией стандартного окна помощи.
- **Интеграция с Rust SDK**: Использование модуля `nativebpm_client::apis::default_api`.

## Сборка
```bash
cargo build --release
```

## Использование
```bash
./target/release/rust-cli --file path/to/schema.bpmn --url http://localhost:8080 --token awesome-token
```
Вызов справки:
```bash
./target/release/rust-cli --help
```
