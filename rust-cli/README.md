# Rust BPMN Deployment CLI Example

This project is an asynchronous CLI application designed to validate and deploy local BPMN 2.0 XML schema definitions to NativeBPM.

## Features
- **Async Execution**: Built on `tokio` for non-blocking HTTP requests.
- **Clap Argument Parser**: Parses target engine `--url`, `--token`, and file path `--file` with clean help guides.
- **Rust Client SDK**: Interacts with `nativebpm_client::apis::default_api` module.

## Build
```bash
cargo build --release
```

## Usage
```bash
./target/release/rust-cli --file path/to/schema.bpmn --url http://localhost:8080 --token awesome-token
```
For help:
```bash
./target/release/rust-cli --help
```
