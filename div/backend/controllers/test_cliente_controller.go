package controllers

import (
	"backend/database"
	"backend/models"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// EjecutarTest maneja las peticiones de testing interno
func EjecutarTest(w http.ResponseWriter, r *http.Request) {
	inicio := time.Now()

	// Parsear la petición
	var testReq models.TestRequest
	err := json.NewDecoder(r.Body).Decode(&testReq)
	if err != nil {
		response := models.TestResponse{
			Exitoso: false,
			Error:   "Error al decodificar JSON: " + err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Validaciones básicas
	if testReq.CanalCodigo == "" {
		response := models.TestResponse{
			Exitoso: false,
			Error:   "El campo 'canalCodigo' es obligatorio",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	if testReq.Trigger == "" {
		response := models.TestResponse{
			Exitoso: false,
			Error:   "El campo 'trigger' es obligatorio",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Buscar el proceso asociado al canal y trigger si no se especifica
	procesoID := testReq.ProcesoID
	if procesoID == "" {
		procesoID, err = obtenerProcesoIDDelCanal(testReq.CanalCodigo, testReq.Trigger)
		if err != nil {
			response := models.TestResponse{
				Exitoso: false,
				Error:   "Error obteniendo proceso del canal: " + err.Error(),
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(response)
			return
		}
	}

	// Preparar petición para BackendMotor
	motorRequest := map[string]interface{}{
		"procesoId":  procesoID,
		"parametros": testReq.Trama,
		"canal":      testReq.CanalCodigo,
		"trigger":    testReq.Trigger,
	}

	// Realizar petición HTTP a BackendMotor
	resultado, err := enviarPeticionAMotor(motorRequest)
	if err != nil {
		// Detectar si es un error completo con información de debug
		errorCompleto := make(map[string]interface{})
		
		if strings.Contains(err.Error(), "ERROR_COMPLETO:") {
			// Extraer JSON del error completo
			errorStr := strings.TrimPrefix(err.Error(), "ERROR_COMPLETO: ")
			json.Unmarshal([]byte(errorStr), &errorCompleto)
		}

		response := models.TestResponse{
			Exitoso:  false,
			Error:    err.Error(),
			Duracion: time.Since(inicio).String(),
		}

		// Agregar información de debug si está disponible
		if len(errorCompleto) > 0 {
			response.Resultado = map[string]interface{}{
				"debugInfo": errorCompleto,
				"requestEnviado": motorRequest,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK) // Cambiar a 200 para que llegue al frontend
		json.NewEncoder(w).Encode(response)
		return
	}

	// Respuesta exitosa
	response := models.TestResponse{
		Exitoso:   true,
		Mensaje:   "Test ejecutado exitosamente",
		Resultado: resultado,
		Duracion:  time.Since(inicio).String(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// obtenerProcesoIDDelCanal busca el proceso asociado a un canal y trigger
func obtenerProcesoIDDelCanal(canalCodigo, trigger string) (string, error) {
	var procesoID string

	query := `
		SELECT cp.proceso_id 
		FROM canal_procesos cp 
		JOIN canales c ON cp.canal_id = c.id 
		WHERE c.codigo = ? AND cp.trigger = ?
		LIMIT 1
	`

	result := database.DB.Raw(query, canalCodigo, trigger).Scan(&procesoID)
	if result.Error != nil {
		return "", result.Error
	}

	if procesoID == "" {
		return "", fmt.Errorf("no se encontró proceso para canal %s con trigger %s", canalCodigo, trigger)
	}

	return procesoID, nil
}

// ObtenerParametrosProceso obtiene los parámetros de entrada de un proceso
func ObtenerParametrosProceso(w http.ResponseWriter, r *http.Request) {
	var request struct {
		CanalCodigo string `json:"canalCodigo" binding:"required"`
		Trigger     string `json:"trigger" binding:"required"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		http.Error(w, "Error al decodificar JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Buscar el proceso
	procesoID, err := obtenerProcesoIDDelCanal(request.CanalCodigo, request.Trigger)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	// Obtener detalles del proceso
	var proceso struct {
		Flujo string `json:"flujo"`
	}
	
	result := database.DB.Raw("SELECT flujo FROM procesos WHERE id = ?", procesoID).Scan(&proceso)
	if result.Error != nil {
		http.Error(w, "Error obteniendo proceso: "+result.Error.Error(), http.StatusInternalServerError)
		return
	}

	// Parsear el flujo para extraer parámetros de entrada
	var flujo map[string]interface{}
	err = json.Unmarshal([]byte(proceso.Flujo), &flujo)
	if err != nil {
		http.Error(w, "Error parseando flujo: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Extraer nodos de entrada
	parametros := extraerParametrosEntrada(flujo)

	response := map[string]interface{}{
		"procesoId":   procesoID,
		"parametros":  parametros,
		"plantilla":   generarPlantillaTrama(parametros),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// extraerParametrosEntrada extrae parámetros de nodos de entrada del flujo
func extraerParametrosEntrada(flujo map[string]interface{}) []map[string]interface{} {
	var parametros []map[string]interface{}
	
	nodes, ok := flujo["nodes"].([]interface{})
	if !ok {
		return parametros
	}

	for _, node := range nodes {
		nodeMap, ok := node.(map[string]interface{})
		if !ok {
			continue
		}

		nodeType, ok := nodeMap["type"].(string)
		if !ok || nodeType != "entrada" {
			continue
		}

		data, ok := nodeMap["data"].(map[string]interface{})
		if !ok {
			continue
		}

		campos, ok := data["campos"].([]interface{})
		if !ok {
			continue
		}

		for _, campo := range campos {
			campoMap, ok := campo.(map[string]interface{})
			if !ok {
				continue
			}

			parametro := map[string]interface{}{
				"nombre": campoMap["nombre"],
				"tipo":   campoMap["tipo"],
			}
			parametros = append(parametros, parametro)
		}
	}

	return parametros
}

// generarPlantillaTrama crea una plantilla JSON con los parámetros
func generarPlantillaTrama(parametros []map[string]interface{}) map[string]interface{} {
	plantilla := make(map[string]interface{})
	
	for _, param := range parametros {
		nombre, ok := param["nombre"].(string)
		if !ok {
			continue
		}

		tipo, ok := param["tipo"].(string)
		if !ok {
			tipo = "string"
		}

		// Generar valor de ejemplo según el tipo
		switch tipo {
		case "string":
			plantilla[nombre] = ""
		case "int", "integer":
			plantilla[nombre] = 0
		case "bool", "boolean":
			plantilla[nombre] = false
		case "array":
			plantilla[nombre] = []interface{}{}
		default:
			plantilla[nombre] = ""
		}
	}

	return plantilla
}

// enviarPeticionAMotor realiza la petición HTTP al BackendMotor
func enviarPeticionAMotor(request map[string]interface{}) (map[string]interface{}, error) {
	// Serializar la petición
	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}

	// URL del BackendMotor (puerto 50000)
	url := "http://localhost:50000/ejecutar-proceso"

	// Crear petición HTTP
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	// Realizar petición
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Leer respuesta
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Parsear respuesta
	var resultado map[string]interface{}
	err = json.Unmarshal(body, &resultado)
	if err != nil {
		return nil, err
	}

	// Capturar TODOS los errores para debugging
	if resp.StatusCode != http.StatusOK {
		// Crear respuesta completa de error para debugging
		errorResponse := map[string]interface{}{
			"httpStatus":    resp.StatusCode,
			"httpStatusText": resp.Status,
			"respuestaCompleta": resultado,
			"bodyRaw":       string(body),
		}
		
		if errorMsg, exists := resultado["error"]; exists {
			errorResponse["errorMotor"] = errorMsg
		}
		
		// Retornar error con información completa
		errorJSON, _ := json.Marshal(errorResponse)
		return nil, fmt.Errorf("ERROR_COMPLETO: %s", string(errorJSON))
	}

	return resultado, nil
}
