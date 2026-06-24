<script setup lang="ts">
import { ref, onMounted } from 'vue';

const API_BASE = 'http://localhost:4000/api';

interface Task {
  id: string;
  name: string;
  activityId: string;
  processId: string;
  instanceId: string;
  assignee: string;
  status: string;
  variables: {
    orderId: string;
    amount: number;
    customerName: string;
  };
}

const tasks = ref<Task[]>([]);
const selectedTask = ref<Task | null>(null);
const selectedInstanceId = ref<string | null>(null);
const schema = ref<any | null>(null);
const formData = ref<Record<string, any>>({});
const newOrder = ref({ customerName: '', amount: 0 });
const statusMsg = ref('');

const fetchTasks = async () => {
  try {
    const res = await fetch(`${API_BASE}/tasks`);
    const data = await res.json();
    tasks.value = data;
  } catch (err) {
    console.error("Error fetching tasks:", err);
  }
};

onMounted(() => {
  fetchTasks();
});

const handleCreateOrder = async () => {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder.value)
    });
    const data = await res.json();
    statusMsg.value = `Order created: ${data.order.id}. Status: ${data.order.status}`;
    if (data.instanceId) {
      selectedInstanceId.value = data.instanceId;
    }
    newOrder.value = { customerName: '', amount: 0 };
    await fetchTasks();
  } catch (err) {
    statusMsg.value = "Failed to create order";
  }
};

const handleSelectTask = async (task: Task) => {
  selectedTask.value = task;
  if (task.instanceId) {
    selectedInstanceId.value = task.instanceId;
  }
  try {
    const res = await fetch(`${API_BASE}/tasks/${task.id}/schema`);
    const schemaData = await res.json();
    schema.value = schemaData;
    
    // Initialize formData with default values from schema
    const initialData: Record<string, any> = {};
    if (schemaData.properties) {
      for (const key of Object.keys(schemaData.properties)) {
        initialData[key] = schemaData.properties[key].default !== undefined 
          ? schemaData.properties[key].default 
          : (schemaData.properties[key].type === 'boolean' ? false : '');
      }
    }
    formData.value = initialData;
  } catch (err) {
    console.error("Error fetching task schema:", err);
  }
};

const handleCompleteTask = async () => {
  if (!selectedTask.value) return;
  try {
    const res = await fetch(`${API_BASE}/tasks/${selectedTask.value.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData.value)
    });
    const data = await res.json();
    statusMsg.value = `Task Completed: ${data.message}`;
    
    // Trigger visualizer refresh by toggling instance ID
    if (selectedInstanceId.value) {
      const currentId = selectedInstanceId.value;
      selectedInstanceId.value = null;
      setTimeout(() => {
        selectedInstanceId.value = currentId;
      }, 100);
    }

    selectedTask.value = null;
    schema.value = null;
    await fetchTasks();
  } catch (err) {
    statusMsg.value = "Failed to complete task";
  }
};
</script>

<template>
  <div class="container py-5">
    <header class="mb-5 pb-3 border-bottom text-center">
      <h1 class="display-5 fw-bold text-success">NativeBPM Portal (Vue 3)</h1>
      <p class="lead text-muted">Declarative Dynamic Schema Forms & BPMN Visualizer</p>
    </header>

    <div class="row g-5">
      <!-- Left Column: Place Order & Tasks -->
      <div class="col-lg-6">
        <!-- Place Order -->
        <div class="card shadow-sm mb-4">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0">1. Place New Order (Triggers BPMN Process)</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="handleCreateOrder">
              <div class="mb-3">
                <label class="form-label">Customer Name</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="newOrder.customerName"
                  required
                />
              </div>
              <div class="mb-3">
                <label class="form-label">Order Amount ($)</label>
                <input
                  type="number"
                  class="form-control"
                  v-model.number="newOrder.amount"
                  required
                />
                <div class="form-text">Amounts > $10,000 will route to Manager Approval task.</div>
              </div>
              <button type="submit" class="btn btn-outline-success w-100">Submit Order</button>
            </form>
          </div>
        </div>

        <!-- Tasks List -->
        <div class="card shadow-sm">
          <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0">2. Active Tasks List</h5>
            <button class="btn btn-sm btn-secondary" @click="fetchTasks">Refresh</button>
          </div>
          <div class="card-body">
            <div v-if="tasks.length === 0" class="text-muted text-center my-3">
              No active human tasks found.
            </div>
            <div v-else class="list-group">
              <button
                v-for="t in tasks"
                :key="t.id"
                @click="handleSelectTask(t)"
                :class="['list-group-item list-group-item-action', selectedTask?.id === t.id ? 'active' : '']"
              >
                <div class="d-flex w-100 justify-content-between">
                  <h6 class="mb-1">{{ t.name }}</h6>
                  <small>{{ t.variables.orderId }}</small>
                </div>
                <p class="mb-1 text-sm text-truncate">
                  Amount: ${{ t.variables.amount }} | Customer: {{ t.variables.customerName }}
                </p>
                <small class="opacity-75">Assignee: {{ t.assignee }}</small>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Dynamic Form -->
      <div class="col-lg-6">
        <div class="card shadow-sm h-100">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">3. Dynamic Task Form (Schema Driven)</h5>
          </div>
          <div class="card-body">
            <div v-if="schema" class="p-3 bg-white rounded border">
              <h5 class="mb-2 text-primary">{{ schema.title }}</h5>
              <p class="text-sm text-muted mb-4">{{ schema.description }}</p>
              
              <form @submit.prevent="handleCompleteTask">
                <div v-for="(prop, name) in schema.properties" :key="name" class="mb-3">
                  <!-- Checkbox type -->
                  <div v-if="prop.type === 'boolean'" class="form-check form-switch my-3">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :id="name.toString()"
                      v-model="formData[name]"
                    />
                    <label class="form-check-label fw-semibold" :for="name.toString()">
                      {{ prop.title }}
                    </label>
                  </div>
                  
                  <!-- ReadOnly Input -->
                  <div v-else-if="prop.readOnly" class="mb-3">
                    <label class="form-label text-muted">{{ prop.title }}</label>
                    <input
                      type="text"
                      class="form-control bg-light"
                      :value="formData[name]"
                      readonly
                    />
                  </div>
                  
                  <!-- Text Area / Note Input -->
                  <div v-else-if="prop.type === 'string'" class="mb-3">
                    <label class="form-label fw-semibold">{{ prop.title }}</label>
                    <textarea
                      class="form-control"
                      rows="3"
                      v-model="formData[name]"
                      :required="schema.required?.includes(name)"
                      :placeholder="'Enter ' + prop.title.toLowerCase()"
                    ></textarea>
                    <div v-if="prop.minLength" class="form-text text-danger-emphasis">
                      Minimum length: {{ prop.minLength }} characters.
                    </div>
                  </div>
                </div>

                <button type="submit" class="btn btn-primary w-100 mt-3">
                  Complete User Task
                </button>
              </form>
            </div>
            
            <div v-else class="text-center py-5 my-5 text-muted">
              <p class="lead">Select a task from the list to render its dynamic form.</p>
              <p class="text-sm">Declarative form fields are generated dynamically on-the-fly using the JSON Schema.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- BPMN Process Visualization Iframe -->
    <div v-if="selectedInstanceId" class="row mt-5">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0">BPMN Process Execution Flow</h5>
            <small class="text-success">Live token-status tracking visualization</small>
          </div>
          <div class="card-body p-0" style="height: 380px; overflow: hidden;">
            <iframe
              :key="selectedInstanceId"
              :src="`${API_BASE}/instances/${selectedInstanceId}/visualization/widget`"
              width="100%"
              height="100%"
              style="border: none;"
            ></iframe>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast message -->
    <div v-if="statusMsg" class="toast-container position-fixed bottom-0 end-0 p-3">
      <div class="toast show align-items-center text-white bg-dark border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">{{ statusMsg }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="statusMsg = ''"></button>
        </div>
      </div>
    </div>
  </div>
</template>
