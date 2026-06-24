package com.example.loan.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.nativebpm.ApiClient;
import com.nativebpm.client.DefaultApi;
import com.nativebpm.client.model.StartInstanceRequest;
import com.nativebpm.client.model.ProcessInstance;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final DefaultApi bpmApi;

    public LoanController() {
        // 1. Initialize the SDK ApiClient
        ApiClient client = new ApiClient();
        client.setBasePath("http://localhost:8080");
        client.setBearerToken("awesome-token");
        this.bpmApi = new DefaultApi(client);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> applyForLoan(@RequestBody Map<String, Object> payload) {
        String loanId = UUID.randomUUID().toString();
        String customerName = (String) payload.getOrDefault("customerName", "Guest");
        Double amount = Double.valueOf(payload.getOrDefault("amount", 0.0).toString());

        Map<String, Object> response = new HashMap<>();
        response.put("loanId", loanId);

        try {
            // 2. Start a BPMN instance using the client
            StartInstanceRequest request = new StartInstanceRequest();
            request.setBusinessKey(loanId);
            
            Map<String, Object> variables = new HashMap<>();
            variables.put("loanId", loanId);
            variables.put("customerName", customerName);
            variables.put("amount", amount);
            request.setVariables(variables);

            ProcessInstance instance = bpmApi.startInstance("loan-scoring-flow", request);
            
            response.put("instanceId", instance.getId());
            response.put("status", "STARTED");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            // Fallback mock simulation when engine is offline
            response.put("status", "AWAITING_REVIEW");
            response.put("message", "Simulated locally (engine offline)");
            return ResponseEntity.accepted().body(response);
        }
    }
}
