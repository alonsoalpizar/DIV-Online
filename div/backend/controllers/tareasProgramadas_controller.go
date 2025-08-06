package controllers

import (
	"backend/database"
	"backend/models"
	"encoding/json"
	"net/http"
	"github.com/gorilla/mux"
	"github.com/google/uuid"
	"time"
	"bytes"
	"fmt"
	"io"
	"strings"
	"strconv"
)

// Listar todas las tareas programadas
func ListarTareasProgramadas(w http.ResponseWriter, r *http.Request) {
	var tareas []models.TareaProgramada
	
	// Incluir información del proceso relacionado
	if err := database.DB.Preload("Proceso").Find(&tareas).Error; err != nil {
		http.Error(w, "Error al listar tareas programadas", http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tareas)
}

// Obtener una tarea programada por ID
func ObtenerTareaProgramada(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var tarea models.TareaProgramada
	
	if err := database.DB.Preload("Proceso").First(&tarea, "id = ?", id).Error; err != nil {
		http.NotFound(w, r)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tarea)
}

// Crear nueva tarea programada
func CrearTareaProgramada(w http.ResponseWriter, r *http.Request) {
	var nueva models.TareaProgramada
	if err := json.NewDecoder(r.Body).Decode(&nueva); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Validar que el proceso existe
	var proceso models.Proceso
	if err := database.DB.First(&proceso, "id = ?", nueva.ProcesoID).Error; err != nil {
		http.Error(w, "Proceso no encontrado", http.StatusBadRequest)
		return
	}

	// Generar ID y establecer valores por defecto
	nueva.ID = uuid.New().String()
	nueva.FechaCreacion = time.Now()
	nueva.FechaActualizacion = time.Now()
	
	// Calcular próxima ejecución basada en la expresión cron
	if proximaEjecucion, err := calcularProximaEjecucion(nueva.ExpresionCron); err == nil {
		nueva.ProximaEjecucion = &proximaEjecucion
	}

	if err := database.DB.Create(&nueva).Error; err != nil {
		http.Error(w, "Error al crear tarea programada", http.StatusInternalServerError)
		return
	}

	// Cargar el proceso para la respuesta
	database.DB.Preload("Proceso").First(&nueva, "id = ?", nueva.ID)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nueva)
}

// Actualizar tarea programada
func ActualizarTareaProgramada(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var actualizada models.TareaProgramada
	if err := json.NewDecoder(r.Body).Decode(&actualizada); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	var existente models.TareaProgramada
	if err := database.DB.First(&existente, "id = ?", id).Error; err != nil {
		http.NotFound(w, r)
		return
	}

	// Validar que el proceso existe
	var proceso models.Proceso
	if err := database.DB.First(&proceso, "id = ?", actualizada.ProcesoID).Error; err != nil {
		http.Error(w, "Proceso no encontrado", http.StatusBadRequest)
		return
	}

	// Mantener ID y actualizar timestamp
	actualizada.ID = id
	actualizada.FechaCreacion = existente.FechaCreacion
	actualizada.FechaActualizacion = time.Now()
	
	// Recalcular próxima ejecución si cambió la expresión cron
	if actualizada.ExpresionCron != existente.ExpresionCron {
		if proximaEjecucion, err := calcularProximaEjecucion(actualizada.ExpresionCron); err == nil {
			actualizada.ProximaEjecucion = &proximaEjecucion
		}
	} else {
		actualizada.ProximaEjecucion = existente.ProximaEjecucion
	}

	if err := database.DB.Save(&actualizada).Error; err != nil {
		http.Error(w, "Error al actualizar tarea programada", http.StatusInternalServerError)
		return
	}

	// Cargar el proceso para la respuesta
	database.DB.Preload("Proceso").First(&actualizada, "id = ?", actualizada.ID)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(actualizada)
}

// Eliminar tarea programada
func EliminarTareaProgramada(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	
	// Eliminar también las ejecuciones relacionadas
	database.DB.Delete(&models.EjecucionTarea{}, "tarea_programada_id = ?", id)
	
	if err := database.DB.Delete(&models.TareaProgramada{}, "id = ?", id).Error; err != nil {
		http.Error(w, "Error al eliminar tarea programada", http.StatusInternalServerError)
		return
	}
	
	w.WriteHeader(http.StatusNoContent)
}

// Ejecutar tarea manualmente
func EjecutarTareaManual(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	
	var tarea models.TareaProgramada
	if err := database.DB.First(&tarea, "id = ?", id).Error; err != nil {
		http.NotFound(w, r)
		return
	}

	// Crear registro de ejecución
	ejecucion := models.EjecucionTarea{
		ID:                uuid.New().String(),
		TareaProgramadaID: tarea.ID,
		FechaEjecucion:    time.Now(),
		Estado:            "ejecutando",
		Trigger:           "manual",
	}
	
	database.DB.Create(&ejecucion)

	// Ejecutar proceso llamando al BackendMotor
	go func() {
		inicioEjecucion := time.Now()
		
		// Llamar al BackendMotor para ejecutar el proceso
		resultado, err := ejecutarProcesoEnMotor(tarea.ProcesoID, tarea.ParametrosEntrada, tarea.CanalCodigo)
		
		// Actualizar registro de ejecución
		ejecucion.DuracionMs = time.Since(inicioEjecucion).Milliseconds()
		
		if err != nil {
			ejecucion.Estado = "error"
			ejecucion.MensajeError = err.Error()
		} else {
			ejecucion.Estado = "exitoso"
			ejecucion.Resultado = resultado
		}
		
		database.DB.Save(&ejecucion)
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"mensaje": "Tarea iniciada manualmente",
		"ejecucionId": ejecucion.ID,
	})
}

// Función auxiliar para ejecutar proceso en el BackendMotor
func ejecutarProcesoEnMotor(procesoID string, parametros map[string]interface{}, canalCodigo string) (map[string]interface{}, error) {
	// Preparar payload para BackendMotor
	payload := map[string]interface{}{
		"procesoId": procesoID,
		"parametros": parametros,
		"canal": canalCodigo,
		"trigger": "manual",
	}
	
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("error preparando payload: %v", err)
	}
	
	// Hacer llamada HTTP al BackendMotor
	resp, err := http.Post("http://localhost:50000/ejecutar-proceso", "application/json", bytes.NewBuffer(payloadJSON))
	if err != nil {
		return nil, fmt.Errorf("error conectando con BackendMotor: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("BackendMotor respondió con error: %s", string(bodyBytes))
	}
	
	// Leer respuesta
	var resultado map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&resultado); err != nil {
		return nil, fmt.Errorf("error decodificando respuesta: %v", err)
	}
	
	return resultado, nil
}

// Obtener historial de ejecuciones de una tarea
func ObtenerEjecucionesTarea(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	
	// Obtener tanto las ejecuciones de div/backend como las del BackendMotor
	// Ambas usan la misma tabla ejecuciones_tareas
	var ejecuciones []models.EjecucionTarea
	if err := database.DB.Where("tarea_programada_id = ?", id).
		Order("fecha_ejecucion DESC").
		Limit(100). // Aumentar límite para ver más ejecuciones
		Find(&ejecuciones).Error; err != nil {
		http.Error(w, "Error al obtener ejecuciones", http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ejecuciones)
}

// Función auxiliar para calcular próxima ejecución
func calcularProximaEjecucion(expresionCron string) (time.Time, error) {
	ahora := time.Now()
	
	// Parsear expresiones del tipo */X * * * * (cada X minutos)
	if strings.HasPrefix(expresionCron, "*/") && strings.HasSuffix(expresionCron, " * * * *") {
		// Extraer el número de minutos
		minutosStr := strings.TrimPrefix(expresionCron, "*/")
		minutosStr = strings.TrimSuffix(minutosStr, " * * * *")
		
		minutos, err := strconv.Atoi(minutosStr)
		if err != nil {
			return time.Time{}, fmt.Errorf("expresión cron inválida: %s", expresionCron)
		}
		
		return ahora.Add(time.Duration(minutos) * time.Minute), nil
	}
	
	// Casos específicos
	switch expresionCron {
	case "0 * * * *": // Cada hora
		return ahora.Add(time.Hour), nil
	case "0 0 * * *": // Diario a medianoche
		proxima := time.Date(ahora.Year(), ahora.Month(), ahora.Day()+1, 0, 0, 0, 0, ahora.Location())
		return proxima, nil
	case "0 0 * * 0": // Semanal (domingos a medianoche)
		diasHastaDomingo := (7 - int(ahora.Weekday())) % 7
		if diasHastaDomingo == 0 {
			diasHastaDomingo = 7
		}
		proxima := time.Date(ahora.Year(), ahora.Month(), ahora.Day()+diasHastaDomingo, 0, 0, 0, 0, ahora.Location())
		return proxima, nil
	default:
		return time.Time{}, fmt.Errorf("expresión cron no soportada: %s", expresionCron)
	}
}