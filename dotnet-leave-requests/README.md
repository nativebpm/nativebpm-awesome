# .NET Leave Requests API Example

This is an ASP.NET Core Web API project demonstrating employee vacation request approvals utilizing the `NativeBPM.Client` SDK.

## Features
- **Controller Routing**: Maps a `POST /api/leaves` endpoint to trigger BPMN workflows.
- **Strongly-Typed Variables**: Demonstrates serializing business variables (`employeeName`, `daysCount`) to process instance contexts.
- **Offline Failure Tolerancy**: Graceful fallback mapping to simulated states.

## Setup
Build the project using .NET Core CLI:
```bash
dotnet build
```

## Run
```bash
dotnet run
```
The API server will listen on default ports (e.g. `http://localhost:5000` or `https://localhost:5001`).
