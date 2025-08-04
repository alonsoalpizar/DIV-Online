package publicador

import (
	"backendmotor/internal/ejecucion"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type LogEntrada struct {
	Timestamp string                 `json:"timestamp"`
	Canal     string                 `json:"canal"`
	Trigger   string                 `json:"trigger"`
	Tipo      string                 `json:"tipo"`
	Input     map[string]interface{} `json:"input"`
	Mensaje   string                 `json:"mensaje"`
}

func GinCanalHandler(c *gin.Context) {
	codigo := c.Param("codigo")
	rest := c.Param("rest")
	fmt.Printf("➡️ Ingreso a GinCanalHandler | Canal: %s | Rest: %s\n", codigo, rest)

	var input map[string]interface{}

	canal, ok := CanalesPublicados[codigo]
	if !ok {
		fmt.Printf("❌ Canal no encontrado: %s\n", codigo)
		c.JSON(http.StatusNotFound, gin.H{"error": "Canal no encontrado"})
		return
	}

	fmt.Printf("✅ Canal encontrado: %s | Tipo: %s | Métodos: %d\n", canal.Codigo, canal.TipoPublicacion, len(canal.Metodos))

	trigger := ""
	switch canal.TipoPublicacion {
	case "REST":
		parts := strings.Split(strings.Trim(rest, "/"), "/")
		if len(parts) > 0 {
			trigger = parts[len(parts)-1] + "|" + c.Request.Method
		}
		fmt.Printf("🔧 Trigger REST construido: %s\n", trigger)

	case "SOAP":
		trigger = c.GetHeader("SOAPAction")
		trigger = strings.Trim(trigger, `"`)
		fmt.Printf("🔧 Trigger SOAP: %s\n", trigger)

		bodyBytes, err := io.ReadAll(c.Request.Body)
		if err != nil {
			fmt.Println("❌ Error leyendo cuerpo SOAP")
			c.JSON(http.StatusBadRequest, gin.H{"estado": 99, "mensaje": "Error leyendo cuerpo SOAP"})
			return
		}

		input, err = extraerParametrosDesdeSOAP(bodyBytes)
		if err != nil {
			fmt.Printf("❌ Error parseando XML SOAP: %v\n", err)
			c.JSON(http.StatusBadRequest, gin.H{"estado": 99, "mensaje": "Error parseando XML SOAP"})
			return
		}

		fmt.Printf("📦 Input desde SOAP: %#v\n", input)

	case "SIMPLE":
		var body map[string]interface{}
		if err := c.ShouldBindJSON(&body); err == nil {
			if t, ok := body["trigger"].(string); ok {
				trigger = t
			}
		}
		fmt.Printf("🔧 Trigger SIMPLE recibido: %s\n", trigger)
	}

	metodo, existe := canal.Metodos[trigger]
	logData := LogEntrada{
		Timestamp: time.Now().Format(time.RFC3339),
		Canal:     canal.Codigo,
		Trigger:   trigger,
		Tipo:      canal.TipoPublicacion,
		Input:     input,
		Mensaje:   "",
	}

	if !existe {
		fmt.Printf("❌ Trigger no encontrado en el canal: %s\n", trigger)
		logData.Mensaje = "Trigger no encontrado en este canal"
		logJSON(logData)
		c.JSON(http.StatusNotFound, gin.H{"error": "Trigger no encontrado"})
		return
	}

	fmt.Printf("✅ Trigger válido, ejecutando proceso: %s\n", metodo.ProcesoID)

	if c.Request.Method == "GET" {
		for k, v := range c.Request.URL.Query() {
			if len(v) > 0 {
				input[k] = v[0]
			}
		}
	} else if c.ContentType() == "application/json" {
		_ = c.BindJSON(&input)
	}

	logData.Input = input
	resultado, err := ejecucion.EjecutarCanal(metodo.ProcesoID, input, canal.Codigo, trigger)
	if err != nil {
		fmt.Printf("❌ Error en ejecución: %v\n", err)
		logData.Mensaje = err.Error()
		logJSON(logData)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("✅ Resultado ejecución: %s | Data: %#v\n", resultado.Mensaje, resultado.Datos)
	logData.Mensaje = resultado.Mensaje
	logJSON(logData)

	if canal.TipoPublicacion == "SOAP" {
		switch strings.ToLower(canal.TipoData) {
		case "xml":
			xmlPayload := construirXMLDesdeMapa("Response", resultado.Datos)
			c.Header("Content-Type", "text/xml")
			c.String(http.StatusOK, construirSOAPResponseRaw(xmlPayload))
			fmt.Printf("📝 XML enviado como respuesta SOAP: %s\n", xmlPayload)

		default:
			dataJSON, err := json.Marshal(resultado.Datos)
			if err != nil {
				fmt.Println("❌ Error generando respuesta JSON")
				c.String(http.StatusInternalServerError, "Error generando respuesta SOAP")
				return
			}
			c.Header("Content-Type", "text/xml")
			c.String(http.StatusOK, construirSOAPResponse("Response", string(dataJSON)))
			fmt.Printf("📝 JSON enviado como respuesta SOAP: %s\n", string(dataJSON))
		}
	} else {
		c.JSON(http.StatusOK, resultado)
	}
}

// otro handler para el nuevo motor
func GinMotorHandler(c *gin.Context) {
	codigo := c.Param("codigo")
	rest := c.Param("rest")
	var input map[string]interface{}

	canal, ok := CanalesPublicados[codigo]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "Canal no encontrado"})
		return
	}

	trigger := ""
	switch canal.TipoPublicacion {
	case "REST":
		parts := strings.Split(strings.Trim(rest, "/"), "/")
		if len(parts) > 0 {
			trigger = parts[len(parts)-1] + "|" + c.Request.Method
		}
	case "SOAP":
		trigger = c.GetHeader("SOAPAction")
		trigger = strings.Trim(trigger, `"`)

		bodyBytes, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"estado": 99, "mensaje": "Error leyendo cuerpo SOAP"})
			return
		}

		input, err = extraerParametrosDesdeSOAP(bodyBytes)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"estado": 99, "mensaje": "Error parseando XML SOAP"})
			return
		}

		fmt.Printf("📩 Trigger recibido: '%s' para motor: %s\n", trigger, codigo)
		fmt.Printf("📦 Input recibido: %#v\n", input)
	case "SIMPLE":
		var body map[string]interface{}
		if err := c.ShouldBindJSON(&body); err == nil {
			if t, ok := body["trigger"].(string); ok {
				trigger = t
			}
		}
	}

	metodo, existe := canal.Metodos[trigger]
	if !existe {
		c.JSON(http.StatusNotFound, gin.H{"error": "Trigger no encontrado"})
		return
	}

	if c.Request.Method == "GET" {
		for k, v := range c.Request.URL.Query() {
			if len(v) > 0 {
				input[k] = v[0]
			}
		}
	} else if c.ContentType() == "application/json" {
		_ = c.BindJSON(&input)
	}

	// 👉 Acá usamos el NUEVO motor
	resultado, err := ejecucion.EjecutarFlujo(metodo.ProcesoID, input, canal.Codigo, trigger)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Reutilizamos la misma lógica de respuesta SOAP/JSON
	if canal.TipoPublicacion == "SOAP" {
		switch strings.ToLower(canal.TipoData) {
		case "xml":
			xmlPayload := construirXMLDesdeMapa("Response", resultado.Datos)
			c.Header("Content-Type", "text/xml")
			c.String(http.StatusOK, construirSOAPResponseRaw(xmlPayload))
		default:
			dataJSON, err := json.Marshal(resultado.Datos)
			if err != nil {
				c.String(http.StatusInternalServerError, "Error generando respuesta SOAP")
				return
			}
			c.Header("Content-Type", "text/xml")
			c.String(http.StatusOK, construirSOAPResponse("Response", string(dataJSON)))
		}
	} else {
		c.JSON(http.StatusOK, resultado)
	}
}

func construirXMLDesdeMapa(etiquetaRaiz string, datos map[string]interface{}) string {
	xml := fmt.Sprintf("<%s>", etiquetaRaiz)
	for k, v := range datos {
		xml += fmt.Sprintf("<%s>%v</%s>", k, v, k)
	}
	xml += fmt.Sprintf("</%s>", etiquetaRaiz)
	return xml
}

func construirSOAPResponseRaw(innerXML string) string {
	return fmt.Sprintf(`
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
   <soap:Body>
      %s
   </soap:Body>
</soap:Envelope>`, innerXML)
}

func logJSON(data LogEntrada) {
	file, err := os.OpenFile("/opt/div/logs/canales.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("[ERROR] No se pudo abrir el log: %v", err)
		return
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	err = encoder.Encode(data)
	if err != nil {
		log.Printf("[ERROR] No se pudo escribir en el log: %v", err)
	}
}
