import { useState, useEffect } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

const API_BASE = 'http://localhost:4000/api';

export default function App() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [schema, setSchema] = useState<any | null>(null);
  const [newOrder, setNewOrder] = useState({ customerName: '', amount: 0 });
  const [statusMsg, setStatusMsg] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateOrder = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      const data = await res.json();
      setStatusMsg(`Order created: ${data.order.id}. Status: ${data.order.status}`);
      if (data.instanceId) {
        setSelectedInstanceId(data.instanceId);
      }
      setNewOrder({ customerName: '', amount: 0 });
      fetchTasks();
    } catch (err) {
      setStatusMsg("Failed to create order");
    }
  };

  const handleSelectTask = async (task: any) => {
    setSelectedTask(task);
    if (task.instanceId) {
      setSelectedInstanceId(task.instanceId);
    }
    try {
      const res = await fetch(`${API_BASE}/tasks/${task.id}/schema`);
      const schemaData = await res.json();
      setSchema(schemaData);
    } catch (err) {
      console.error("Error fetching task schema:", err);
    }
  };

  const handleCompleteTask = async ({ formData }: any) => {
    if (!selectedTask) return;
    try {
      const res = await fetch(`${API_BASE}/tasks/${selectedTask.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setStatusMsg(`Task Completed: ${data.message}`);
      
      // Update selected visualization to show completed state
      if (selectedInstanceId) {
        const currentId = selectedInstanceId;
        setSelectedInstanceId(null);
        setTimeout(() => setSelectedInstanceId(currentId), 100);
      }
      
      setSelectedTask(null);
      setSchema(null);
      fetchTasks();
    } catch (err) {
      setStatusMsg("Failed to complete task");
    }
  };

  return (
    <div className="container py-5">
      <header className="mb-5 pb-3 border-bottom text-center">
        <h1 className="display-5 fw-bold text-primary">NativeBPM Portal</h1>
        <p className="lead text-muted">Human-in-the-Loop & Dynamic JSON Schema Form Demo</p>
      </header>

      <div className="row g-5">
        {/* Left Side: Create Order and Tasks List */}
        <div className="col-lg-6">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">1. Place New Order (Triggers BPMN Process)</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateOrder}>
                <div className="mb-3">
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newOrder.customerName}
                    onChange={e => setNewOrder({ ...newOrder, customerName: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Order Amount ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newOrder.amount || ''}
                    onChange={e => setNewOrder({ ...newOrder, amount: parseFloat(e.target.value) })}
                    required
                  />
                  <div className="form-text">Amounts &gt; $10,000 will route to Manager Approval task.</div>
                </div>
                <button type="submit" className="btn btn-outline-primary w-100">Submit Order</button>
              </form>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">2. Active Tasks List</h5>
              <button className="btn btn-sm btn-secondary" onClick={fetchTasks}>Refresh</button>
            </div>
            <div className="card-body">
              {tasks.length === 0 ? (
                <p className="text-muted text-center my-3">No active human tasks found.</p>
              ) : (
                <div className="list-group">
                  {tasks.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTask(t)}
                      className={`list-group-item list-group-item-action ${selectedTask?.id === t.id ? 'active' : ''}`}
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{t.name}</h6>
                        <small>{t.variables.orderId}</small>
                      </div>
                      <p className="mb-1 text-sm text-truncate">
                        Amount: ${t.variables.amount} | Customer: {t.variables.customerName}
                      </p>
                      <small className="opacity-75">Assignee: {t.assignee}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Dynamic Form */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">3. Dynamic Task Form</h5>
            </div>
            <div className="card-body">
              {schema ? (
                <div className="p-3 bg-white rounded border">
                  <Form
                    schema={schema}
                    validator={validator}
                    onSubmit={handleCompleteTask}
                    className="rjsf-bootstrap"
                  />
                </div>
              ) : (
                <div className="text-center py-5 my-5 text-muted">
                  <p className="lead">Select a task from the list to render its dynamic form.</p>
                  <p className="text-sm">The form is rendered in real-time from the JSON Schema definition returned by the engine.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedInstanceId && (
        <div className="row mt-5">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">BPMN Process Execution Flow</h5>
                <small className="text-info">Real-time status updates via NativeBPM SDK</small>
              </div>
              <div className="card-body p-0" style={{ height: '380px', overflow: 'hidden' }}>
                <iframe
                  key={selectedInstanceId}
                  src={`${API_BASE}/instances/${selectedInstanceId}/visualization/widget`}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {statusMsg && (
        <div className="toast-container position-fixed bottom-0 end-0 p-3">
          <div className="toast show align-items-center text-white bg-dark border-0" role="alert">
            <div className="d-flex">
              <div className="toast-body">{statusMsg}</div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setStatusMsg('')}></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
