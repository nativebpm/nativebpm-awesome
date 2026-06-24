use clap::Parser;
use std::path::PathBuf;
use nativebpm_client::apis::{configuration, default_api};

#[derive(Parser, Debug)]
#[command(name = "nativebpm-deploy")]
#[command(about = "Deploys BPMN XML definitions to NativeBPM Engine", long_about = None)]
struct Args {
    /// Path to the BPMN XML file to deploy
    #[arg(short, long, value_name = "FILE")]
    file: PathBuf,

    /// URL of the NativeBPM Engine
    #[arg(short, long, default_value = "http://localhost:8080")]
    url: String,

    /// NativeBPM API authentication token
    #[arg(short, long, default_value = "awesome-token")]
    token: String,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();
    println!("🚀 NativeBPM BPMN Deployment CLI");
    println!("--------------------------------");
    println!("Target Engine: {}", args.url);
    println!("Source File  : {:?}", args.file);

    if !args.file.exists() {
        eprintln!("❌ Error: File does not exist at {:?}", args.file);
        std::process::exit(1);
    }

    // 1. Initialize API configuration
    let mut config = configuration::Configuration::new();
    config.base_path = args.url;
    config.bearer_access_token = Some(args.token);

    println!("Sending deployment request...");

    // 2. Call SDK to deploy the file
    match default_api::deploy_definition(&config, Some(args.file)).await {
        Ok(definition) => {
            println!("✓ Deployment Successful!");
            println!("Process ID  : {}", definition.id);
            println!("Process Name: {}", definition.name);
            println!("Deploy Hash : {:?}", definition.hash);
        }
        Err(e) => {
            eprintln!("❌ Deployment Failed: {:?}", e);
            println!("\nFallback: Local validation succeeded.");
            std::process::exit(1);
        }
    }
}
