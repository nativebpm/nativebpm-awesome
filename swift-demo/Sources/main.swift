import Foundation
import NativeBPMClient
#if canImport(AnyCodable)
import AnyCodable
#endif

@available(macOS 10.15, iOS 13.0, tvOS 13.0, watchOS 6.0, *)
func runExample() async {
    print("=== NativeBPM External Swift SDK Test ===")
    
    let client = Client(baseURL: "http://localhost:8080", apiToken: "awesome-token")
    
    // 1. Build workflow
    let workflow = Workflow(id: "awesome-swift-process", name: "Awesome Swift Process")
    workflow
        .when(V("isPremium").eq(true)).then { b in
            b.user("vipService", name: "VIP Customer Support", options: ["assignee": "vip_manager"])
        }.else { b in
            b.service("standardNotify", name: "Send Regular Notification", topic: "notification_topic")
        }
    
    do {
        print("Deploying workflow definition...")
        let definition = try await client.deploy(workflow)
        print("✓ Deployed process definition (hash: \(definition.hash))")
        
        print("Starting process instance...")
        let instance = try await client.instances().start(definition.id)
            .withBusinessKey("awesome-biz-swift-101")
            .withVariable("isPremium", AnyCodable(true))
            .send()
        print("✓ Started process instance ID: \(instance.id) (completed: \(instance.completed))")
        
    } catch {
        print("Note: Local engine deployment skipped. Details: \(error.localizedDescription)")
    }
}

// Start the async task and wait
let semaphore = DispatchSemaphore(value: 0)
Task {
    if #available(macOS 10.15, iOS 13.0, tvOS 13.0, watchOS 6.0, *) {
        await runExample()
    }
    semaphore.signal()
}
semaphore.wait()
