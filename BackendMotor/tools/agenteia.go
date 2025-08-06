// agenteia.go - Versión mejorada con modo sesión y system prompt
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type RequestPayload struct {
	Model     string    `json:"model"`
	MaxTokens int       `json:"max_tokens"`
	System    string    `json:"system,omitempty"`
	Messages  []Message `json:"messages"`
}

type ResponsePayload struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
}

const sessionFile = "session.json"
const defaultSystem = "You are a backend engineer assistant specialized in Go and integration architectures. Be precise and concise. Only return code unless asked otherwise."

func loadSession() []Message {
	var messages []Message
	data, err := os.ReadFile(sessionFile)
	if err == nil {
		json.Unmarshal(data, &messages)
	}
	return messages
}

func saveSession(messages []Message) {
	data, _ := json.MarshalIndent(messages, "", "  ")
	os.WriteFile(sessionFile, data, 0644)
}

func main() {
	godotenv.Load("/opt/BackendMotor/.env")
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		fmt.Println("API key not found in .env")
		return
	}

	args := os.Args[1:]
	if len(args) == 0 {
		fmt.Println("Uso: agenteia [--session] [--system \"prompt\"] \"mensaje\"")

		return
	}

	useSession := false
	systemPrompt := defaultSystem
	var userPrompt string

	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "--session":
			useSession = true
		case "--system":
			if i+1 < len(args) {
				systemPrompt = args[i+1]
				i++
			}
		default:
			userPrompt = strings.Join(args[i:], " ")
			break
		}
	}

	var messages []Message
	if useSession {
		messages = loadSession()
	}
	messages = append(messages, Message{Role: "user", Content: userPrompt})

	payload := RequestPayload{
		Model:     "claude-3-5-sonnet-20241022",
		MaxTokens: 1024,
		System:    systemPrompt,
		Messages:  messages,
	}

	jsonData, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(jsonData))
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("content-type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error en request:", err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error leyendo respuesta:", err)
		return
	}

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Error HTTP %d: %s\n", resp.StatusCode, string(body))
		return
	}
	
	var result ResponsePayload
	if err := json.Unmarshal(body, &result); err != nil {
		fmt.Println("Error parseando JSON:", err)
		fmt.Println("Respuesta raw:", string(body))
		return
	}

	fmt.Println("🧠 Respuesta de Claude:")
	for _, c := range result.Content {
		fmt.Println(c.Text)
		if useSession {
			messages = append(messages, Message{Role: "assistant", Content: c.Text})
		}
	}

	if useSession {
		saveSession(messages)
	}
}
