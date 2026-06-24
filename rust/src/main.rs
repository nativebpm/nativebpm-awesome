use nativebpm_client::{Workflow, v, deploy_workflow};
use nativebpm_client::apis::{configuration, default_api};

#[tokio::main]
async fn main() {
    println!("=== NativeBPM External Rust SDK Test ===");

    // 1. Build workflow
    let mut workflow = Workflow::new("awesome-rust-process", "Awesome Rust Process");
    workflow
        .when(v("isPremium").eq(true))
        .then(|b| {
            b.user("vipService", "VIP Customer Support", serde_json::json!({ "assignee": "vip_manager" }));
        })
        .Else(|b| {
            b.service("standardNotify", "Send Regular Notification", "notification_topic", serde_json::json!({}));
        });

    // 2. Initialize config
    let mut config = configuration::Configuration::new();
    config.base_path = "http://localhost:8080".to_string();
    config.bearer_access_token = Some("awesome-token".to_string());

    println!("Deploying workflow definition...");
    match deploy_workflow(&config, &workflow).await {
        Ok(definition) => {
            println!("✓ Deployed process definition (hash: {:?})", definition.hash);

            // 3. Start instance
            let mut variables = std::collections::HashMap::new();
            variables.insert("isPremium".to_string(), serde_json::json!(true));

            let start_request = nativebpm_client::models::StartInstanceRequest {
                instance_id: None,
                business_key: Some("awesome-biz-rust-101".to_string()),
                variables: Some(variables),
            };

            match default_api::start_instance(&config, "awesome-rust-process", Some(start_request)).await {
                Ok(instance) => {
                    println!("✓ Started process instance ID: {} (completed: {})", instance.id, instance.completed);
                }
                Err(e) => {
                    println!("Error starting instance: {:?}", e);
                }
            }
        }
        Err(e) => {
            println!("Note: Local engine deployment skipped. Details: {:?}", e);
        }
    }
}
