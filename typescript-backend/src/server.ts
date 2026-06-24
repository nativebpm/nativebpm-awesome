import express from 'express';
import cors from 'cors';
import { Client, Workflow, v } from '@nativebpm/sdk';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const nativeBpmClient = new Client("http://localhost:8080", "awesome-token");

// 1. Build and deploy process definition on startup
async function setupWorkflow() {
  console.log("🔨 Setting up Order Approval BPMN Workflow...");
  const workflow = new Workflow("order-approval-flow", "Order Approval Flow");
  
  workflow
    .service("validateDetails", "Validate Order Details", "order_validation")
    .when(v("amount").gt(10000))
    .then(flow => {
      // Big orders require manager approval with dynamic JSON Schema Form
      flow.user("managerApproval", "Manager Approval Task", {
        assignee: "sales_manager",
        // Extension elements for forms metadata
        formKey: "manager-approval-form"
      });
    })
    .else(flow => {
      flow.service("autoApprove", "Auto Approve Order", "order_auto_approve");
    });

  try {
    const definition = await nativeBpmClient.deploy(workflow);
    console.log(`✓ Workflow deployed successfully! Hash: ${definition.hash}`);
  } catch (err: any) {
    console.log(`Note: NativeBPM Engine deployment skipped. Using in-memory fallback. (${err.message || err})`);
  }
}

// 2. Mock Database
let orders: any[] = [];
let mockTasks: any[] = [
  {
    id: "task_01",
    name: "Manager Approval Task",
    activityId: "managerApproval",
    processId: "order-approval-flow",
    assignee: "sales_manager",
    status: "CREATED",
    variables: {
      orderId: "ORD-9921",
      amount: 15200,
      customerName: "Acme Corp"
    }
  }
];

// JSON Schema for Manager Approval Task
const approvalFormSchema = {
  title: "Order Approval Form",
  description: "A manager must approve orders exceeding $10,000.",
  type: "object",
  required: ["approved", "managerNotes"],
  properties: {
    customerName: {
      type: "string",
      title: "Customer Name",
      readOnly: true
    },
    orderAmount: {
      type: "number",
      title: "Order Amount ($)",
      readOnly: true
    },
    approved: {
      type: "boolean",
      title: "Approve Order",
      default: false
    },
    managerNotes: {
      type: "string",
      title: "Review Notes",
      minLength: 5
    }
  }
};

// 3. REST API Endpoints
app.post('/api/orders', async (req, res) => {
  const { customerName, amount } = req.body;
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const order = { id: orderId, customerName, amount, status: 'PENDING', instanceId: '' };
  orders.push(order);

  console.log(`Starting process for ${orderId} (Amount: $${amount})...`);
  try {
    const instance = await nativeBpmClient.instances().start("order-approval-flow")
      .withBusinessKey(orderId)
      .withVariable("orderId", orderId)
      .withVariable("customerName", customerName)
      .withVariable("amount", amount)
      .send();
    
    order.instanceId = instance.id;
    res.status(201).json({ order, instanceId: instance.id });
  } catch (err: any) {
    // If engine is offline, simulate process routing locally
    const instanceId = `inst_${Math.floor(1000 + Math.random() * 9000)}`;
    order.instanceId = instanceId;
    if (amount > 10000) {
      mockTasks.push({
        id: `task_${Math.floor(100 + Math.random() * 900)}`,
        name: "Manager Approval Task",
        activityId: "managerApproval",
        processId: "order-approval-flow",
        instanceId: instanceId,
        assignee: "sales_manager",
        status: "CREATED",
        variables: { orderId, amount, customerName }
      });
      order.status = "AWAITING_APPROVAL";
    } else {
      order.status = "APPROVED";
    }
    res.status(201).json({ order, instanceId, note: "Simulated locally (engine offline)" });
  }
});

app.get('/api/tasks', (req, res) => {
  res.json(mockTasks.filter(t => t.status === "CREATED"));
});

app.get('/api/tasks/:id/schema', (req, res) => {
  const task = mockTasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  
  // Inject runtime variables into read-only schema fields
  const schema = JSON.parse(JSON.stringify(approvalFormSchema));
  schema.properties.customerName.default = task.variables.customerName;
  schema.properties.orderAmount.default = task.variables.amount;
  
  res.json(schema);
});

app.post('/api/tasks/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { approved, managerNotes } = req.body;
  
  const task = mockTasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  task.status = "COMPLETED";
  console.log(`Task ${id} completed. Decision: ${approved ? 'APPROVED' : 'REJECTED'}. Notes: ${managerNotes}`);

  try {
    // Call NativeBPM client to complete the task
    await nativeBpmClient.tasks().complete(id)
      .withVariable("approved", approved)
      .withVariable("managerNotes", managerNotes)
      .send();
    res.json({ message: "Task completed on engine" });
  } catch (err) {
    // Fallback simulation
    const order = orders.find(o => o.id === task.variables.orderId);
    if (order) {
      order.status = approved ? "APPROVED" : "REJECTED";
    }
    res.json({ message: "Task completed locally (engine offline)" });
  }
});

// Endpoint to retrieve the ready-to-embed HTML process visualization widget
app.get('/api/instances/:id/visualization/widget', async (req, res) => {
  const { id } = req.params;
  try {
    // Try to get from actual engine via SDK
    const html = await nativeBpmClient.instances().getVisualizationHTML(id);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    // Fallback: return mock visualization HTML
    // Find the task or corresponding order
    const task = mockTasks.find(t => t.instanceId === id);
    const order = orders.find(o => o.instanceId === id);
    
    const amount = task ? task.variables.amount : (order ? order.amount : 15000);
    const isCompleted = task ? task.status === "COMPLETED" : (order ? (order.status === "APPROVED" || order.status === "REJECTED") : false);
    
    const html = getMockVisualizationHTML(id, amount, isCompleted);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }
});

// Endpoint to retrieve process instance visualization data as JSON
app.get('/api/instances/:id/visualization', async (req, res) => {
  const { id } = req.params;
  try {
    const data = await nativeBpmClient.instances().getVisualization(id);
    return res.json(data);
  } catch (err) {
    const task = mockTasks.find(t => t.instanceId === id);
    const order = orders.find(o => o.instanceId === id);
    
    const amount = task ? task.variables.amount : (order ? order.amount : 15000);
    const isCompleted = task ? task.status === "COMPLETED" : (order ? (order.status === "APPROVED" || order.status === "REJECTED") : false);
    
    let activeNodes: string[] = [];
    let completedNodes: string[] = [];
    if (isCompleted) {
      completedNodes = ["start", "validateDetails", "gateway", "end"];
      if (amount > 10000) completedNodes.push("managerApproval");
      else completedNodes.push("autoApprove");
    } else {
      completedNodes = ["start", "validateDetails", "gateway"];
      if (amount > 10000) activeNodes = ["managerApproval"];
      else completedNodes.push("autoApprove", "end");
    }

    return res.json({
      instanceId: id,
      definitionId: "order-approval-flow",
      xml: getBpmnXml(),
      activeNodes,
      waitingNodes: [],
      completedNodes,
      completed: isCompleted
    });
  }
});

function getBpmnXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_OrderApproval" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="order-approval-flow" name="Order Approval Flow" isExecutable="true">
    <bpmn:startEvent id="start" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:serviceTask id="validateDetails" name="Validate Details">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="start" targetRef="validateDetails" />
    <bpmn:exclusiveGateway id="gateway" name="Amount > $10k?">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_Manual</bpmn:outgoing>
      <bpmn:outgoing>Flow_Auto</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:sequenceFlow id="Flow_2" sourceRef="validateDetails" targetRef="gateway" />
    <bpmn:userTask id="managerApproval" name="Manager Approval">
      <bpmn:incoming>Flow_Manual</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:sequenceFlow id="Flow_Manual" name="Yes" sourceRef="gateway" targetRef="managerApproval" />
    <bpmn:serviceTask id="autoApprove" name="Auto Approve">
      <bpmn:incoming>Flow_Auto</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:sequenceFlow id="Flow_Auto" name="No" sourceRef="gateway" targetRef="autoApprove" />
    <bpmn:endEvent id="end" name="End">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_3" sourceRef="managerApproval" targetRef="end" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="autoApprove" targetRef="end" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="order-approval-flow">
      <bpmndi:BPMNShape id="_BPMNShape_start" bpmnElement="start">
        <dc:Bounds x="156" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="162" y="145" width="25" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_validateDetails" bpmnElement="validateDetails">
        <dc:Bounds x="240" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_gateway" bpmnElement="gateway" isMarkerVisible="true">
        <dc:Bounds x="390" y="95" width="50" height="50" />
        <bpmndi:BPMNLabel><dc:Bounds x="376" y="65" width="79" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_managerApproval" bpmnElement="managerApproval">
        <dc:Bounds x="500" y="180" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_autoApprove" bpmnElement="autoApprove">
        <dc:Bounds x="500" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_end" bpmnElement="end">
        <dc:Bounds x="670" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="678" y="145" width="20" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="192" y="120" />
        <di:waypoint x="240" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="120" />
        <di:waypoint x="390" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Manual_di" bpmnElement="Flow_Manual">
        <di:waypoint x="415" y="145" />
        <di:waypoint x="415" y="220" />
        <di:waypoint x="500" y="220" />
        <bpmndi:BPMNLabel><dc:Bounds x="421" y="180" width="18" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Auto_di" bpmnElement="Flow_Auto">
        <di:waypoint x="440" y="120" />
        <di:waypoint x="500" y="120" />
        <bpmndi:BPMNLabel><dc:Bounds x="463" y="102" width="15" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="600" y="220" />
        <di:waypoint x="688" y="220" />
        <di:waypoint x="688" y="138" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="600" y="120" />
        <di:waypoint x="670" y="120" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

function getMockVisualizationHTML(instanceId: string, amount: number, isCompleted: boolean) {
  let activeNodes: string[] = [];
  let completedNodes: string[] = [];

  if (isCompleted) {
    completedNodes = ["start", "validateDetails", "gateway", "end"];
    if (amount > 10000) {
      completedNodes.push("managerApproval");
    } else {
      completedNodes.push("autoApprove");
    }
  } else {
    completedNodes = ["start", "validateDetails", "gateway"];
    if (amount > 10000) {
      activeNodes = ["managerApproval"];
    } else {
      // auto-approved, completes immediately
      completedNodes.push("autoApprove", "end");
    }
  }

  const bpmnXml = getBpmnXml();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BPMN Progress Viewer (Local Simulation)</title>
  <link rel="stylesheet" href="https://unpkg.com/bpmn-js@16.4.0/dist/assets/diagram-js.css" />
  <link rel="stylesheet" href="https://unpkg.com/bpmn-js@16.4.0/dist/assets/bpmn-font/css/bpmn-embedded.css" />
  <style>
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #0f172a; color: #f8fafc; height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
    #canvas { width: 100%; height: 100%; background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%); }
    .header { padding: 12px 20px; background: rgba(30, 41, 59, 0.8); border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 0.95rem; font-weight: 600; color: #38bdf8; }
    .badge { font-size: 0.75rem; padding: 4px 8px; border-radius: 9999px; font-weight: 500; }
    .badge-active { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .badge-completed { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    
    /* BPMN Overrides for Dark Mode */
    .djs-visual rect { fill: #1e293b !important; stroke: #475569 !important; stroke-width: 2px !important; }
    .djs-visual circle, .djs-visual polygon { fill: #1e293b !important; stroke: #475569 !important; stroke-width: 2px !important; }
    .djs-visual text { fill: #cbd5e1 !important; font-family: 'Inter', sans-serif !important; font-size: 11px !important; }
    .djs-connection .djs-visual path { stroke: #475569 !important; stroke-width: 2px !important; }

    /* Highlights */
    .highlight-active .djs-visual > rect,
    .highlight-active .djs-visual > circle {
      stroke: #38bdf8 !important;
      stroke-width: 3px !important;
      fill: rgba(56, 189, 248, 0.15) !important;
      filter: drop-shadow(0 0 8px #38bdf8);
    }
    .highlight-active text { fill: #f8fafc !important; font-weight: 600 !important; }

    .highlight-completed .djs-visual > rect,
    .highlight-completed .djs-visual > circle,
    .highlight-completed .djs-visual > polygon {
      stroke: #10b981 !important;
      stroke-width: 2px !important;
      fill: rgba(16, 185, 129, 0.1) !important;
    }
    .highlight-completed text { fill: #34d399 !important; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Process Instance: ${instanceId}</div>
    <span class="badge ${isCompleted ? 'badge-completed' : 'badge-active'}">
      ${isCompleted ? 'Completed' : 'Active'}
    </span>
  </div>
  <div id="canvas"></div>

  <script src="https://unpkg.com/bpmn-js@16.4.0/dist/bpmn-viewer.production.min.js"></script>
  <script>
    const bpmnXml = \`${bpmnXml}\`;
    const viewer = new BpmnJS({ container: '#canvas' });
    
    async function loadDiagram() {
      try {
        await viewer.importXML(bpmnXml);
        viewer.get('canvas').zoom('fit-viewport');
        
        const canvas = viewer.get('canvas');
        
        const activeNodes = ${JSON.stringify(activeNodes)};
        const completedNodes = ${JSON.stringify(completedNodes)};
        
        completedNodes.forEach(node => {
          try { canvas.addMarker(node, 'highlight-completed'); } catch(e){}
        });
        activeNodes.forEach(node => {
          try { canvas.addMarker(node, 'highlight-active'); } catch(e){}
        });
      } catch (err) {
        console.error('Error rendering diagram:', err);
      }
    }
    
    loadDiagram();
  </script>
</body>
</html>`;
}

app.listen(PORT, async () => {
  console.log(`🚀 TypeScript Backend running on http://localhost:${PORT}`);
  await setupWorkflow();
});
