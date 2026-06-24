# PHP Document Approvals Example

This Composer-managed script demonstrates how to integrate the NativeBPM PHP SDK to handle document approval workflows.

## Features
- **Path Repository Resolution**: References the local PHP SDK directory (`sdk/php`) cleanly in monorepo workspaces.
- **Fluent SDK Invocation**: Starts process instances via the `DefaultApi` using structured model arguments.
- **Graceful Failure Fallbacks**: Implements try-catch blocks to catch connection timeouts and run local simulations.

## Installation
```bash
composer install
```

## Running
```bash
php index.php
```
