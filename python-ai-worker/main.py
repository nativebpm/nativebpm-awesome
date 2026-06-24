import time
import os
import random
from nativebpm import Client

# Configure connection to NativeBPM
NATIVEBPM_URL = os.getenv("NATIVEBPM_URL", "http://localhost:8080")
API_TOKEN = os.getenv("NATIVEBPM_TOKEN", "awesome-token")

def simulate_llm_inference(prompt: str) -> str:
    """
    Simulates calling Google Gemini API or running a local LLM inference.
    """
    print(f"🤖 Sending prompt to LLM: {prompt!r}")
    time.sleep(2)  # Simulate network latency
    
    decisions = [
        "Approved: The order fits standard transaction risk guidelines.",
        "Approved: Verified customer records are clean and active.",
        "Rejected: High risk transactional footprint detected."
    ]
    return random.choice(decisions)

def main():
    print("🤖 Starting NativeBPM AI Worker...")
    
    # 1. Initialize NativeBPM Client
    client = Client(base_url=NATIVEBPM_URL, api_token=API_TOKEN)
    
    print(f"Connected to NativeBPM engine at: {NATIVEBPM_URL}")
    print("Long-polling for AI-related Human Tasks...")

    while True:
        try:
            # 2. Fetch pending tasks assigned to 'ai_agent'
            tasks = client.tasks().list().with_assignee("ai_agent").with_status("CREATED").send()
            
            if not tasks:
                print("No pending AI tasks. Sleeping for 5 seconds...")
                time.sleep(5)
                continue

            for task in tasks:
                print(f"🔔 Found Task: {task.name} (ID: {task.id}) for Instance: {task.instance_id}")
                
                # Extract variables
                vars = task.variables or {}
                customer = vars.get("customerName", "Unknown")
                amount = vars.get("amount", 0)

                prompt = f"Analyze order for customer '{customer}' amounting to ${amount}. Should we approve it?"
                
                # Run AI analysis
                decision_text = simulate_llm_inference(prompt)
                approved = "Approved" in decision_text
                
                print(f"🤖 LLM Analysis Result: {decision_text} (Approved: {approved})")

                # 3. Complete the task using Fluent SDK API
                client.tasks().complete(task.id) \
                    .with_variable("aiApproved", approved) \
                    .with_variable("aiNotes", decision_text) \
                    .send()
                
                print(f"✓ Task {task.id} completed successfully.")
                
        except Exception as e:
            # Engine offline fallback simulation
            print(f"Note: Polling failed or engine offline: {e}")
            print("Simulating local worker execution for demonstration...")
            time.sleep(5)

if __name__ == "__main__":
    main()
