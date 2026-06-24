import 'package:flutter/material';
import 'package:nativebpm_client/nativebpm_client.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NativeBPM Mobile Portal',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.deepPurple,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const TaskListScreen(),
    );
  }
}

class TaskListScreen extends StatefulWidget {
  const TaskListScreen({super.key});

  @override
  State<TaskListScreen> createState() => _TaskListScreenState();
}

class _TaskListScreenState extends State<TaskListScreen> {
  // Initialize the NativeBPM SDK Client
  late final Client _bpmClient;
  List<dynamic> _tasks = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    // Connect to the host backend (localhost:4000/api)
    _bpmClient = Client('http://localhost:8080', 'awesome-token');
    _refreshTasks();
  }

  Future<void> _refreshTasks() async {
    setState(() => _isLoading = true);
    try {
      // In a real-world scenario, you fetch tasks assigned to the user
      final tasksService = _bpmClient.tasks();
      final activeTasks = await tasksService.list()
          .withStatus('CREATED')
          .withAssignee('sales_manager')
          .send();

      setState(() {
        _tasks = activeTasks;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load tasks: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('NativeBPM Tasks (Dart SDK)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshTasks,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _tasks.isEmpty
              ? const Center(child: Text('No pending Human Tasks.'))
              : ListView.builder(
                  itemCount: _tasks.length,
                  itemBuilder: (context, index) {
                    final task = _tasks[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: ListTile(
                        title: Text(task.name ?? 'Unnamed Task'),
                        subtitle: Text('Instance: ${task.instanceId}'),
                        trailing: const Icon(Icons.arrow_forward_ios),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => TaskDetailsScreen(
                                client: _bpmClient,
                                task: task,
                                onCompleted: _refreshTasks,
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
    );
  }
}

class TaskDetailsScreen extends StatefulWidget {
  final Client client;
  final dynamic task;
  final VoidCallback onCompleted;

  const TaskDetailsScreen({
    super.key,
    required this.client,
    required this.task,
    required this.onCompleted,
  });

  @override
  State<TaskDetailsScreen> createState() => _TaskDetailsScreenState();
}

class _TaskDetailsScreenState extends State<TaskDetailsScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isApproved = false;
  final _notesController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitApproval() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSubmitting = true);
    try {
      // Use the Fluent Task Completion API in the SDK
      await widget.client.tasks().complete(widget.task.id)
          .withVariable('approved', _isApproved)
          .withVariable('managerNotes', _notesController.text)
          .send();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Task completed successfully!')),
        );
        widget.onCompleted();
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error completing task: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final vars = widget.task.variables ?? {};

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.task.name ?? 'Task Details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Dynamic Task Info',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.cyan),
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildInfoRow('Order ID', vars['orderId']?.toString() ?? 'N/A'),
                    _buildInfoRow('Customer', vars['customerName']?.toString() ?? 'N/A'),
                    _buildInfoRow('Amount', '\$${vars['amount']?.toString() ?? '0'}'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Actions & Inputs',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.greenAccent),
            ),
            const SizedBox(height: 8),
            Form(
              key: _formKey,
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text('Approve Order'),
                    value: _isApproved,
                    onChanged: (val) {
                      setState(() {
                        _isApproved = val;
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _notesController,
                    decoration: const InputDecoration(
                      labelText: 'Review Notes',
                      border: OutlineInputBorder(),
                      hintText: 'Enter review details...',
                    ),
                    validator: (val) {
                      if (val == null || val.length < 5) {
                        return 'Review notes must be at least 5 characters long';
                      }
                      return null;
                    },
                    maxLines: 3,
                  ),
                  const SizedBox(height: 24),
                  _isSubmitting
                      ? const CircularProgressIndicator()
                      : ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size.fromHeight(50),
                          ),
                          onPressed: _submitApproval,
                          child: const Text('Submit Decision'),
                        ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.between,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(value),
        ],
      ),
    );
  }
}
