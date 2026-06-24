import { Workflow, Client, v } from '@nativebpm/sdk';

export async function run() {
  console.log("=== NativeBPM External TS SDK Test ===");

  // 1. Build workflow
  const workflow = new Workflow('awesome-ts-process', 'Awesome TS Process');
  workflow
    .when(v('isPremium').eq(true))
    .then(flow => {
      flow.user('vipService', 'VIP Customer Support', { assignee: 'vip_manager' });

    })
    .else(flow => {
      flow.service('standardNotify', 'Send Regular Notification', 'notification_topic');
    });
  
  // 2. Initialize client
  const client = new Client("http://localhost:8080", "awesome-token");
  
  console.log("Deploying workflow definition...");
  try {
    const definition = await client.deploy(workflow);
    console.log(`✓ Deployed process definition (hash: ${definition.hash})`);
    
    // 3. Start instance
    const instance = await client.instances().start(definition.id)
      .withBusinessKey("awesome-biz-ts-101")
      .withVariable("isPremium", true)
      .send();
    console.log(`✓ Started process instance ID: ${instance.id} (completed: ${instance.completed})`);
    
  } catch (error: any) {
    console.log(`Note: Local engine deployment skipped. Details: ${error.message || error}`);
  }
}

run();
