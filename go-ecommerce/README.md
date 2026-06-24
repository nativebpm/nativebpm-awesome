# Go E-Commerce Webhook Server Example

This Gin-based backend server demonstrates starting BPMN instances and verifying secure event webhooks sent by NativeBPM.

## Features
- **Checkout Process**: Initiates order-fulfillment BPMN workflow instances via the Go SDK client.
- **HMAC Webhook Verification**: Implements a middleware verifying incoming `X-NativeBPM-Signature` headers to secure callbacks.
- **Go 1.22 Support**: Direct package resolution without `go.work` setups.

## Run
```bash
go run main.go
```
The server will start on `http://localhost:8081`.
