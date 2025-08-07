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
	extraHeaders := servidor.Extras

	// 🔍 Extraer configuración del nodo
	endpoint, ok := nodo.Data["objeto"].(string)
	if !ok || endpoint == "" {
		return "", errors.New("endpoint no definido en el nodo")
	}

	// 🎆 Filtrar solo parámetros que deben enviarse al servidor
	parametrosFiltrados := getParametrosFiltradosYOrdenadosREST(nodo)
	
	// Crear payload solo con parámetros filtrados
	payloadParaServidor := make(map[string]interface{})
	for _, param := range parametrosFiltrados {
		if val, existe := resultado[param.Nombre]; existe {
			payloadParaServidor[param.Nombre] = val
		}
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

	// 🧩 Preparar body (solo si no es GET) - usar payload filtrado
	var body io.Reader
	if metodo != "GET" {
		// Usar solo los parámetros filtrados para el body
		bodyBytes, err := json.Marshal(payloadParaServidor)
		if err != nil {
			return "", fmt.Errorf("error serializando parámetros filtrados: %w", err)
		}
		body = bytes.NewReader(bodyBytes)
	} else {
		// Para GET, agregar parámetros filtrados como query params
		if len(payloadParaServidor) > 0 {
			params := make([]string, 0, len(payloadParaServidor))
			for k, v := range payloadParaServidor {
				params = append(params, fmt.Sprintf("%s=%v", k, v))
			}
			if strings.Contains(url, "?") {
				url += "&" + strings.Join(params, "&")
			} else {
				url += "?" + strings.Join(params, "&")
			}
		}
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

// Estructura de parámetro para filtrado (igual que en PostgreSQL)
type ParametroFiltradoREST struct {
	Nombre          string `json:"nombre"`
	Tipo            string `json:"tipo"`
	EnviarAServidor *bool  `json:"enviarAServidor,omitempty"`
	Orden           *int   `json:"orden,omitempty"`
}

// getParametrosFiltradosYOrdenadosREST extrae y filtra parámetros del nodo para REST
func getParametrosFiltradosYOrdenadosREST(n estructuras.NodoGenerico) []ParametroFiltradoREST {
	var parametros []ParametroFiltradoREST
	
	// Extraer parámetros de entrada del nodo
	if parametrosRaw, exists := n.Data["parametrosEntrada"]; exists {
		if parametrosBytes, err := json.Marshal(parametrosRaw); err == nil {
			var parametrosCompletos []ParametroFiltradoREST
			if err := json.Unmarshal(parametrosBytes, &parametrosCompletos); err == nil {
				parametros = parametrosCompletos
			}
		}
	}

	// Filtrar solo los que deben enviarse al servidor
	var filtrados []ParametroFiltradoREST
	for _, param := range parametros {
		enviar := true // Por defecto true para retrocompatibilidad
		if param.EnviarAServidor != nil {
			enviar = *param.EnviarAServidor
		}
		
		if enviar {
			filtrados = append(filtrados, param)
		}
	}

	// Ordenar por campo orden
	for i := 0; i < len(filtrados); i++ {
		for j := i + 1; j < len(filtrados); j++ {
			ordenI := 999999 // valor alto por defecto
			ordenJ := 999999

			if filtrados[i].Orden != nil {
				ordenI = *filtrados[i].Orden
			}
			if filtrados[j].Orden != nil {
				ordenJ = *filtrados[j].Orden
			}

			if ordenI > ordenJ {
				filtrados[i], filtrados[j] = filtrados[j], filtrados[i]
			}
		}
	}

	return filtrados
}
