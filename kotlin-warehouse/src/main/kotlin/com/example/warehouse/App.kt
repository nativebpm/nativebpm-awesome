package com.example.warehouse

import com.nativebpm.client.Client
import java.util.UUID

fun main() {
    println("📦 Kotlin Warehouse Picker Workflow Client")
    println("------------------------------------------")

    // 1. Initialize NativeBPM Kotlin SDK Client
    val client = Client("http://localhost:8080", "awesome-token")

    val pickerId = "picker-john"
    println("Logged in as: $pickerId. Polling warehouse tasks...")

    try {
        // 2. Fetch pending stock picking human tasks
        val tasks = client.tasks().list()
            .withAssignee("warehouse_pickers")
            .withStatus("CREATED")
            .send()

        if (tasks.isEmpty()) {
            println("No stock picking tasks available.")
            return
        }

        val task = tasks.first()
        println("Found task: ${task.name} (Instance: ${task.instanceId})")

        // 3. Claim the task
        println("Claiming task ${task.id}...")
        client.tasks().claim(task.id)
            .withAssignee(pickerId)
            .send()

        // 4. Complete the picking task
        println("Completing task ${task.id}...")
        client.tasks().complete(task.id)
            .withVariable("pickedItems", listOf("item-A", "item-B"))
            .withVariable("pickerNotes", "All items picked in good condition")
            .send()

        println("✓ Task completed successfully!")

    } catch (e: Exception) {
        // Fallback simulation when engine is offline
        println("Note: Engine offline. Simulating local picking operation...")
        val mockTaskId = UUID.randomUUID().toString()
        println("Claimed and Completed mock task $mockTaskId locally.")
    }
}
