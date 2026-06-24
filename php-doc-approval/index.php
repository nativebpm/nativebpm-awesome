<?php
require_once __DIR__ . '/vendor/autoload.php';

use NativeBPM\Client\Configuration;
use NativeBPM\Client\Api\DefaultApi;
use NativeBPM\Client\Model\StartInstanceRequest;

// 1. Initialize NativeBPM SDK Client Configuration
$config = Configuration::getDefaultConfiguration()
    ->setHost("http://localhost:8080")
    ->setApiKey("Authorization", "awesome-token")
    ->setApiKeyPrefix("Authorization", "Bearer");

$bpmApi = new DefaultApi(null, $config);

// Mock dynamic request inputs
$docId = "DOC-" . rand(1000, 9999);
$docTitle = "Annual Budget Review 2026";
$department = "Finance";

echo "=== Document Approval Workflow Client ===\n";
echo "Document: $docTitle ($docId)\n";
echo "Submitting to NativeBPM...\n";

try {
    // 2. Prepare start request variables
    $startRequest = new StartInstanceRequest([
        "business_key" => $docId,
        "variables" => [
            "documentId" => $docId,
            "title" => $docTitle,
            "department" => $department
        ]
    ]);

    // Start instance on engine
    $instance = $bpmApi->startInstance("document-approval-flow", $startRequest);

    echo "✓ Workflow started successfully!\n";
    echo "Instance ID: " . $instance->getId() . "\n";
    echo "Completed: " . ($instance->getCompleted() ? 'Yes' : 'No') . "\n";

} catch (Exception $e) {
    // Fallback mock simulation when engine is offline
    echo "Note: Engine offline. Simulating process execution locally...\n";
    echo "Status: AWAITING_APPROVAL (Simulated locally)\n";
}
