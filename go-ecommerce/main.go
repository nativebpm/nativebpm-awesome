package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gitlab.com/nativebpm/sdk/go"
)

const (
	webhookSecret = "super-secret-webhook-key"
	engineURL     = "http://localhost:8080"
	apiToken      = "awesome-token"
)

func main() {
	r := gin.Default()

	// 1. Initialize the NativeBPM Go SDK Client
	client, err := nativebpm.NewClient(engineURL, apiToken)
	if err != nil {
		log.Fatalf("Failed to initialize NativeBPM client: %v", err)
	}

	// 2. Checkout endpoint - starts the e-commerce fulfillment workflow
	r.POST("/checkout", func(c *gin.Context) {
		var req struct {
			OrderID      string  `json:"order_id" binding:"required"`
			CustomerName string  `json:"customer_name" binding:"required"`
			Amount       float64 `json:"amount" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Start workflow process instance
		ctx := context.Background()
		instance, err := client.Instances().Start("order-fulfillment-flow").
			WithBusinessKey(req.OrderID).
			WithVariable("orderId", req.OrderID).
			WithVariable("customerName", req.CustomerName).
			WithVariable("amount", req.Amount).
			Send(ctx)

		if err != nil {
			// Engine offline fallback simulation
			log.Printf("Engine offline: starting order %s locally", req.OrderID)
			c.JSON(http.StatusAccepted, gin.H{
				"status":      "ACCEPTED",
				"order_id":    req.OrderID,
				"instance_id": "mock_inst_" + req.OrderID,
				"message":     "Order received. Simulated locally (engine offline).",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":      "STARTED",
			"order_id":    req.OrderID,
			"instance_id": instance.Id,
		})
	})

	// 3. Secure Webhook endpoint - receives real-time events from NativeBPM engine
	r.POST("/webhook", func(c *gin.Context) {
		// Read raw request body for HMAC verification
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
			return
		}

		// Verify signature header
		signature := c.GetHeader("X-NativeBPM-Signature")
		if !verifyHMACSignature(body, signature, webhookSecret) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid webhook signature"})
			return
		}

		log.Printf("✓ Valid webhook signature received. Processing event...")
		
		// Event processed successfully
		c.JSON(http.StatusOK, gin.H{"status": "EVENT_PROCESSED"})
	})

	log.Println("🚀 Go E-Commerce Webhook Server running on http://localhost:8081")
	if err := r.Run(":8081"); err != nil {
		log.Fatalf("Failed to run web server: %v", err)
	}
}

// verifyHMACSignature validates that incoming webhook signature matches our secret
func verifyHMACSignature(payload []byte, signatureHeader string, secretKey string) bool {
	if signatureHeader == "" {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write(payload)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(signatureHeader), []byte(expectedSignature))
}
