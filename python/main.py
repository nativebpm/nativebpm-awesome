import sys
import os

from nativebpm import Client, Workflow, V

def main():
    print("=== NativeBPM External Python SDK Test ===")
    
    # 1. Build workflow
    workflow = Workflow("awesome-python-process", "Awesome Python Process")
    workflow.when(V("isPremium").eq(True)).then(
        lambda flow: flow.user("vipService", "VIP Customer Support", assignee="vip_manager")
    ).Else(
        lambda flow: flow.service("standardNotify", "Send Regular Notification", "notification_topic")
    )

    # 2. Create client
    client = Client(base_url="http://localhost:8080", api_token="awesome-token")


    print("Deploying workflow definition...")
    try:
        definition = client.deploy(workflow)
        print(f"✓ Deployed process definition (hash: {definition.hash})")
        
        # 3. Start instance
        instance = (
            client.instances()
            .start("awesome-python-process")
            .business_key("awesome-biz-py-101")
            .variables({"isPremium": True})
            .send()
        )
        print(f"✓ Started process instance ID: {instance.id} (completed: {instance.completed})")
    except Exception as e:
        print(f"Note: Local engine deployment skipped. Details: {e}")

if __name__ == "__main__":
    main()
