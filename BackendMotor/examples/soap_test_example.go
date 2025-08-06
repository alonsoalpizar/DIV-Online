package main

import (
	"encoding/json"
	"fmt"

	"backendmotor/internal/ejecucion/ejecutores"
	"backendmotor/internal/estructuras"
	"backendmotor/internal/models"
)

// Ejemplo de uso del conector SOAP
func main() {
	fmt.Println("🧼 Ejemplo de prueba del Conector SOAP")
	fmt.Println("=====================================")

	// 1. Configurar servidor SOAP de ejemplo
	servidor := models.Servidor{
		ID:     "test-soap-server",
		Nombre: "Servidor SOAP de Prueba",
		Tipo:   "SOAP",
		Host:   "http://httpbin.org/xml", // Servicio de prueba
		Puerto: 80,
		Extras: map[string]interface{}{
			"wsdl_url":    "http://httpbin.org/xml", // Endpoint que retorna XML
			"soap_action": "http://example.org/TestAction",
			"namespace":   "http://example.org/",
			"timeout":     "10s",
		},
	}

	// 2. Configurar nodo proceso
	nodo := estructuras.NodoGenerico{
		ID:   "test-soap-node",
		Type: "proceso",
		Data: map[string]interface{}{
			"label":      "Prueba SOAP",
			"servidorId": "test-soap-server",
			"objeto":     "TestMethod",
			"parametrosEntrada": []map[string]interface{}{
				{"nombre": "param1", "tipo": "string"},
				{"nombre": "param2", "tipo": "int"},
			},
			"parametrosSalida": []map[string]interface{}{
				{"nombre": "result", "tipo": "string"},
			},
			"parsearFullOutput": true,
		},
	}

	// 3. Datos de entrada de prueba
	resultado := map[string]interface{}{
		"param1": "valor_prueba",
		"param2": 12345,
	}

	fmt.Println("📋 Configuración:")
	fmt.Printf("   Servidor: %s (%s)\n", servidor.Nombre, servidor.Tipo)
	fmt.Printf("   Endpoint: %s:%d\n", servidor.Host, servidor.Puerto)
	fmt.Printf("   Método: %s\n", nodo.Data["objeto"])
	fmt.Println()

	// 4. Ejecutar conector SOAP
	fmt.Println("🚀 Ejecutando conector SOAP...")
	fullOutput, err := ejecutores.EjecutarSOAP(nodo, resultado, servidor, "test-proceso-id")

	// 5. Mostrar resultados
	fmt.Println()
	fmt.Println("📊 Resultados:")
	fmt.Println("==============")

	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
	} else {
		fmt.Println("✅ Ejecución exitosa")
	}

	fmt.Printf("📄 FullOutput (%d caracteres):\n", len(fullOutput))
	if len(fullOutput) > 200 {
		fmt.Printf("   %s...\n", fullOutput[:200])
	} else {
		fmt.Printf("   %s\n", fullOutput)
	}

	fmt.Println()
	fmt.Println("📦 Contenido de resultado:")
	resultJson, _ := json.MarshalIndent(resultado, "   ", "  ")
	fmt.Printf("   %s\n", resultJson)

	fmt.Println()
	fmt.Println("🎯 Ejemplo de XML SOAP que se generaría:")
	ejemploXML := `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <TestMethod xmlns="http://example.org/">
      <param1>valor_prueba</param1>
      <param2>12345</param2>
    </TestMethod>
  </soap:Body>
</soap:Envelope>`
	fmt.Println(ejemploXML)

	fmt.Println()
	fmt.Println("📚 Para usar en producción:")
	fmt.Println("   1. Configurar servidor SOAP en la base de datos")
	fmt.Println("   2. Crear nodo proceso en el flujo visual")
	fmt.Println("   3. Configurar parametrosEntrada y parametrosSalida")
	fmt.Println("   4. Activar parsearFullOutput si es necesario")
	fmt.Println()
	fmt.Println("✨ ¡Conector SOAP listo para usar!")
}

// Función auxiliar para mostrar la estructura del SOAP envelope que se construye
func ejemploSOAPEnvelope() {
	fmt.Println("🔍 Estructura del SOAP Envelope generado:")
	fmt.Println("=========================================")
	
	ejemplo := `
POST /servicio HTTP/1.1
Host: api.ejemplo.com
Content-Type: text/xml; charset=utf-8
SOAPAction: "http://ejemplo.com/TestAction"
Authorization: Basic dXNlcjpwYXNz

<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <TestMethod xmlns="http://ejemplo.com/">
      <param1>valor1</param1>
      <param2>123</param2>
    </TestMethod>
  </soap:Body>
</soap:Envelope>
`
	fmt.Println(ejemplo)
}