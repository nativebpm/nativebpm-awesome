package main

import (
	"context"
	"fmt"
	"log"

	"gitlab.com/nativebpm/sdk/go"
)

func main() {
	fmt.Println("=== NativeBPM External Go SDK Test ===")
	ctx := context.Background()

	// 1. Build a workflow using the Fluent API
	workflow := nativebpm.NewWorkflow("awesome-go-process", "Awesome Go Process")
	workflow.
		When(nativebpm.V("isPremium").Eq(true)).
		Then(func(flow *nativebpm.Branch) {
			flow.User("vipService", "VIP Customer Support", nativebpm.M{"assignee": "vip_manager"})
		}).
		Else(func(flow *nativebpm.Branch) {
			flow.Service("standardNotify", "Send Regular Notification", "notification_topic")
		})

	// 2. Initialize the client
	client, err := nativebpm.NewClient("http://localhost:8080", "awesome-token")
	if err != nil {
		log.Fatalf("Error creating client: %v", err)
	}

	fmt.Println("Deploying workflow definition...")
	definition, err := client.Deploy(ctx, workflow)
	if err != nil {
		fmt.Printf("Note: Local engine deployment skipped (no running engine at localhost:8080). Details: %v\n", err)
		return
	}
	fmt.Printf("✓ Deployed process definition (hash: %s)\n", definition.Hash)

	// 3. Start instance
	instance, err := client.Instances().Start("awesome-go-process").
		WithBusinessKey("awesome-biz-101").
		WithVariable("isPremium", true).
		Send(ctx)
	if err != nil {
		log.Fatalf("Error starting instance: %v", err)
	}
	fmt.Printf("✓ Started process instance ID: %s (completed: %t)\n", instance.Id, instance.Completed)
}
