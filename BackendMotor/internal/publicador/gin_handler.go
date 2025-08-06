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
	fmt.Printf("🏗️ construirXMLDesdeMapa: etiqueta='%s', datos=%v\n", etiquetaRaiz, datos)
	xml := fmt.Sprintf("<%s>", etiquetaRaiz)
	for k, v := range datos {
		elementoXML := construirElementoXML(k, v)
		fmt.Printf("🧱 Elemento generado para '%s': %s\n", k, elementoXML)
		xml += elementoXML
	}
	xml += fmt.Sprintf("</%s>", etiquetaRaiz)
	fmt.Printf("🎯 XML final construido: %s\n", xml)
	return xml
}

// construirElementoXML maneja la conversión recursiva de diferentes tipos de datos a XML
func construirElementoXML(nombre string, valor interface{}) string {
	fmt.Printf("🔍 construirElementoXML: nombre='%s', tipo=%T, valor=%v\n", nombre, valor, valor)
	switch v := valor.(type) {
	case []map[string]interface{}:
		// Array específico de mapas - crear múltiples elementos XML con el mismo nombre
		xml := ""
		for _, item := range v {
			xml += fmt.Sprintf("<%s>", nombre)
			for subKey, subVal := range item {
				xml += construirElementoXML(subKey, subVal)
			}
			xml += fmt.Sprintf("</%s>", nombre)
		}
		return xml
	case []interface{}:
		// Array de elementos - crear múltiples elementos XML con el mismo nombre
		xml := ""
		for _, item := range v {
			if itemMap, ok := item.(map[string]interface{}); ok {
				// Si el item es un mapa, expandir sus campos como sub-elementos
				xml += fmt.Sprintf("<%s>", nombre)
				for subKey, subVal := range itemMap {
					xml += construirElementoXML(subKey, subVal)
				}
				xml += fmt.Sprintf("</%s>", nombre)
			} else {
				// Si el item es un valor simple, crear elemento simple
				xml += fmt.Sprintf("<%s>%v</%s>", nombre, item, nombre)
			}
		}
		return xml
	case map[string]interface{}:
		// Objeto - expandir como sub-elementos
		xml := fmt.Sprintf("<%s>", nombre)
		for subKey, subVal := range v {
			xml += construirElementoXML(subKey, subVal)
		}
		xml += fmt.Sprintf("</%s>", nombre)
		return xml
	default:
		// Valor simple - elemento XML directo
		return fmt.Sprintf("<%s>%v</%s>", nombre, valor, nombre)
	}
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
