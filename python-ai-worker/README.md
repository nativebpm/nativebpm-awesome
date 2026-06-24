# Python AI Agent Worker Example

This project demonstrates a Python background worker pulling and executing AI tasks from the NativeBPM engine.

## Features
- **Task Polling**: Long-polls for active tasks assigned to `ai_agent` utilizing `client.tasks().list()`.
- **Gemini Mock Integration**: Analyzes incoming order details (amount, customer records) and decides on approval using simulated LLM prompts.
- **Fluent Completion API**: Submits decision variables and reviews back to the engine.

## Setup
Create virtual environment and install packages:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run
```bash
python main.py
```
