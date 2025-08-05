package ejecutores

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"backendmotor/internal/database"
	"backendmotor/internal/estructuras"
	"backendmotor/internal/models"
)

func EjecutarREST(nodo estructuras.NodoGenerico, resultado map[string]interface{}, servidor models.Servidor) (string, error) {
	// 🧪 Preparar extras del servidor (headers, etc.)
	// 🧪 Preparar extras del servidor (headers, etc.)
	extraHeaders := servidor.Extras

	// 🔍 Extraer configuración del nodo
	endpoint, ok := nodo.Data["objeto"].(string)
	if !ok || endpoint == "" {
		return "", errors.New("endpoint no definido en el nodo")
	}

	metodo := strings.ToUpper(fmt.Sprint(nodo.Data["metodoHttp"]))
	if metodo == "" || metodo == "<NIL>" {
		metodo = "GET"
	}
	tagPadre := fmt.Sprint(nodo.Data["tagPadre"])
	tipoRespuesta := fmt.Sprint(nodo.Data["tipoRespuesta"])
	parsear := false
	if val, ok := nodo.Data["parsearFullOutput"].(bool); ok {
		parsear = val
	}

	// 🌐 Armar URL completa
	url := strings.TrimRight(servidor.Host, "/") + "/" + strings.TrimLeft(endpoint, "/")

	// 🧩 Preparar body (solo si no es GET)
	var body io.Reader
	if metodo != "GET" {
		bodyBytes, err := json.Marshal(resultado)
		if err != nil {
			return "", fmt.Errorf("error serializando parámetros de entrada: %w", err)
		}
		body = bytes.NewReader(bodyBytes)
	}

	// 🧠 Preparar request
	req, err := http.NewRequest(metodo, url, body)
	if err != nil {
		return "", fmt.Errorf("error creando request: %w", err)
	}

	// 🧱 Headers desde extras del servidor
	for k, v := range extraHeaders {
		vStr := strings.TrimSpace(fmt.Sprint(v))
		if vStr == "" {
			continue
		}
		switch strings.ToLower(k) {
		case "apikey":
			req.Header.Set("X-API-Key", vStr)
		case "authorization":
			req.Header.Set("Authorization", vStr)
		default:
			req.Header.Set(k, vStr)
		}
	}

	// 🕒 Timeout si está definido en extras
	timeout := 10 * time.Second
	if tStr, ok := extraHeaders["timeout"].(string); ok && tStr != "" {
		if tParsed, err := time.ParseDuration(tStr); err == nil {
			timeout = tParsed
		}
	}
	client := &http.Client{Timeout: timeout}

	// 🚀 Hacer la petición
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("error ejecutando request: %w", err)
	}
	defer resp.Body.Close()

	// 📦 Leer respuesta
	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error leyendo respuesta: %w", err)
	}

	fullOutput := string(respBytes)
	resultado["FullOutput"] = fullOutput

	// 🧠 Si parsearFullOutput está activo, y hay parametrosSalida definidos → parseamos
	if parsear {
		salidaRaw, tiene := nodo.Data["parametrosSalida"]
		if !tiene || salidaRaw == nil {
			// Si no hay campos definidos, generarlos y agregarlos al nodo
			if camposGenerados, err := estructuras.ParsearFullOutputComoCampos(fullOutput, tipoRespuesta, tagPadre); err == nil {
				nodo.Data["parametrosSalida"] = camposGenerados
				_ = database.ActualizarNodoEnFlujo(nodo)
				nodo.Data["parsearFullOutput"] = false
			}
		} else {
			if salidaBytes, err := json.Marshal(salidaRaw); err == nil {
				var camposSalida []estructuras.Campo
				if err := json.Unmarshal(salidaBytes, &camposSalida); err == nil {
					if camposParseados, err := estructuras.MapearCamposDesdeFullOutput(fullOutput, tipoRespuesta, tagPadre, camposSalida); err == nil {
						for _, campo := range camposParseados {
							resultado[campo.Nombre] = "" // valor vacío por ahora
						}
					}

				}
			}
		}
	}

	return fullOutput, nil
}
