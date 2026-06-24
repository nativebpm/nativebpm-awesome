# Flutter Mobile Client Example

This Dart / Flutter project demonstrates integration with the `nativebpm_client` SDK on mobile devices.

## Features
- **Task Feeds**: Pulls pending human tasks using `client.tasks().list()`.
- **Claim & Completion**: Demonstrates claim (`client.tasks().claim()`) and completion API (`client.tasks().complete()`).
- **Dynamic Inputs**: Allows operators to review variables and enter decision inputs.

## Setup
Ensure Flutter SDK is installed and run:
```bash
flutter pub get
```

## Run
```bash
flutter run
```
