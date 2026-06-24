# Java Loan Pipeline Example

This is a Spring Boot Web Application demonstrating financial loan underwriting workflow triggers using the `nativebpm-java-client` SDK.

## Features
- **Java ApiClient Configuration**: Sets up endpoint target hosts and bearer token authentication headers.
- **REST Controller Mapping**: Exposes a `POST /api/loans` endpoint which calls the NativeBPM engine to start process instance templates.
- **ACID Fallback Simulation**: Gracefully responds to requests when the workflow runner service is offline.

## Setup
Build the application using Maven:
```bash
mvn clean compile
```

## Run
```bash
mvn spring-boot:run
```
The application will launch on port `8080` (or configured custom port).
