package ejecucion

import (
	"backendmotor/internal/database"
	"backendmotor/internal/estructuras"
	"backendmotor/internal/models"
	"backendmotor/internal/monitoring"
	"backendmotor/internal/utils"
	"fmt"
	"time"

	"github.com/prometheus/client_golang/prometheus"
)

// ContextoSubproceso mantiene el contexto de ejecución anidada
type ContextoSubproceso struct {
	ProcesoID       string                   // ID del proceso actual
	ParentProcesoID string                   // ID del proceso padre
	Variables       map[string]interface{}   // Variables del contexto actual
	Globales        map[string]interface{}   // Variables globales heredadas
	Depth           int                      // Profundidad de anidación
	CallStack       []string                 // Pila de llamadas para detectar recursión
	TraceID         string                   // ID de traza para logging
	Timeout         time.Duration            // Timeout para este subproceso
	Inicio          time.Time                // Tiempo de inicio
}

// ResultadoSubproceso contiene el resultado de ejecutar un subproceso
type ResultadoSubproceso struct {
	Salidas      map[string]interface{} // Valores de salida normales
	CodigoError  string                 // Código de error si hubo fallo
	MensajeError string                 // Mensaje de error
	DetalleError string                 // Detalle adicional del error
	Estado       int                    // Estado de ejecución (0 = ok, 99 = error)
	DuracionMs   int64                  // Duración en millisegundos
}

const (
	MaxDepth          = 10              // Máxima profundidad de anidación
	DefaultTimeoutMs  = 60000           // Timeout por defecto: 60 segundos
)

// ejecutarNodoSubproceso ejecuta otro proceso como subproceso del flujo actual
func ejecutarNodoSubproceso(
	n estructuras.NodoGenerico,
	resultado map[string]interface{},
	contexto *ContextoSubproceso,
	canalCodigo string,
) (map[string]interface{}, map[string]interface{}, error) {
	inicio := time.Now()
	nodoID := n.ID
	
	// Registrar inicio de ejecución
	utils.RegistrarEjecucionLog(utils.RegistroEjecucion{
		Timestamp:     time.Now().Format(time.RFC3339),
		ProcesoId:     contexto.ProcesoID,
		NombreProceso: "Subproceso",
		Canal:         canalCodigo,
		TipoObjeto:    "subproceso",
		NombreObjeto:  nodoID,
		Parametros:    map[string]interface{}{"depth": contexto.Depth, "parent": contexto.ParentProcesoID},
		Estado:        "iniciando",
	})

	// 1. Obtener el procesoId del subproceso a ejecutar
	procesoID, ok := n.Data["procesoId"].(string)
	if !ok || procesoID == "" {
		err := fmt.Errorf("procesoId no definido en nodo subproceso %s", nodoID)
		utils.RegistrarEjecucionLog(utils.RegistroEjecucion{
			Timestamp:     time.Now().Format(time.RFC3339),
			ProcesoId:     contexto.ProcesoID,
			NombreProceso: "Subproceso",
			Canal:         canalCodigo,
			TipoObjeto:    "subproceso",
			NombreObjeto:  nodoID,
			Parametros:    map[string]interface{}{"error": "procesoId no definido"},
			Estado:        "error",
		})
		return resultado, nil, err
	}
	
	fmt.Printf("🔄 Ejecutando subproceso: %s desde nodo: %s\n", procesoID, nodoID)

	// 2. Validar profundidad máxima
	if contexto == nil {
		contexto = &ContextoSubproceso{
			Depth:     0,
			CallStack: []string{},
			Globales:  make(map[string]interface{}),
			Inicio:    inicio,
		}
	}
	
	if contexto.Depth >= MaxDepth {
		err := fmt.Errorf("profundidad máxima alcanzada (%d) en subproceso %s", MaxDepth, procesoID)
		monitoring.SubprocessErrors.Inc()
		return resultado, nil, err
	}

	// 3. Detectar recursión (ciclos)
	for _, pid := range contexto.CallStack {
		if pid == procesoID {
			err := fmt.Errorf("recursión detectada: proceso %s ya está en la pila de llamadas", procesoID)
			monitoring.SubprocessErrors.Inc()
			return resultado, nil, err
		}
	}

	// 4. Preparar parámetros de entrada del subproceso
	parametrosEntrada := make(map[string]interface{})
	if asignacionesRaw, ok := n.Data["asignaciones"].(map[string]interface{}); ok {
		for _, mapeos := range asignacionesRaw {
			if mapeosArr, ok := mapeos.([]interface{}); ok {
				for _, mapeo := range mapeosArr {
					if m, ok := mapeo.(map[string]interface{}); ok {
						destino := m["destino"].(string)
						tipo := m["tipo"].(string)
						valor := m["valor"]
						
						if tipo == "campo" {
							// Mapear desde el resultado actual
							if val, exists := resultado[valor.(string)]; exists {
								parametrosEntrada[destino] = val
							}
						} else if tipo == "valor" {
							parametrosEntrada[destino] = valor
						}
					}
				}
			}
		}
	}

	// 5. Obtener timeout del nodo (si está configurado)
	timeoutMs := DefaultTimeoutMs
	if timeoutRaw, ok := n.Data["timeoutMs"]; ok {
		if tm, ok := timeoutRaw.(float64); ok {
			timeoutMs = int(tm)
		}
	}

	// 6. Crear contexto hijo
	contextoHijo := &ContextoSubproceso{
		ProcesoID:       procesoID,
		ParentProcesoID: contexto.ProcesoID,
		Variables:       parametrosEntrada,
		Globales:        contexto.Globales, // Heredar globales
		Depth:           contexto.Depth + 1,
		CallStack:       append(contexto.CallStack, contexto.ProcesoID),
		TraceID:         contexto.TraceID,
		Timeout:         time.Duration(timeoutMs) * time.Millisecond,
		Inicio:          time.Now(),
	}

	// Agregar variables globales estándar si no existen
	if contextoHijo.Globales["Usuario"] == nil {
		contextoHijo.Globales["Usuario"] = "sistema"
	}
	if contextoHijo.Globales["Fecha"] == nil {
		contextoHijo.Globales["Fecha"] = time.Now().Format("2006-01-02")
	}

	// 7. Ejecutar el subproceso
	fmt.Printf("🚀 Iniciando ejecución del subproceso %s con contexto depth=%d\n", procesoID, contextoHijo.Depth)
	resultadoSub, err := ejecutarSubprocesoInterno(contextoHijo, canalCodigo)
	
	// Registrar métricas
	duracion := time.Since(inicio).Seconds()
	monitoring.SubprocessDuration.Observe(duracion)
	
	fmt.Printf("✅ Subproceso %s completado. Error: %v, Salidas: %v\n", procesoID, err, resultadoSub)
	
	if err != nil {
		monitoring.SubprocessErrors.Inc()
		monitoring.SubprocessTotal.With(prometheus.Labels{"status": "error"}).Inc()
		
		// Propagar error como campos de error
		resultado["codigoError"] = "SUB_ERROR"
		resultado["mensajeError"] = fmt.Sprintf("Error en subproceso: %v", err)
		resultado["detalleError"] = err.Error()
		
		utils.RegistrarEjecucionLog(utils.RegistroEjecucion{
			Timestamp:     time.Now().Format(time.RFC3339),
			ProcesoId:     contexto.ProcesoID,
			NombreProceso: "Subproceso",
			Canal:         canalCodigo,
			TipoObjeto:    "subproceso",
			NombreObjeto:  nodoID,
			Parametros:    parametrosEntrada,
			Resultado:     map[string]interface{}{"error": err.Error()},
			Estado:        "error",
			DuracionMs:    int64(duracion * 1000),
		})
		
		return resultado, nil, nil // No devolver error para permitir ruteo a salidaError
	}

	monitoring.SubprocessTotal.With(prometheus.Labels{"status": "success"}).Inc()

	// 8. Mapear salidas del subproceso al resultado actual
	for k, v := range resultadoSub.Salidas {
		resultado[k] = v
	}

	// Si hay error en el subproceso, agregarlo al resultado
	if resultadoSub.Estado == 99 {
		resultado["codigoError"] = resultadoSub.CodigoError
		resultado["mensajeError"] = resultadoSub.MensajeError
		resultado["detalleError"] = resultadoSub.DetalleError
	}

	// 9. Registrar finalización exitosa
	utils.RegistrarEjecucionLog(utils.RegistroEjecucion{
		Timestamp:     time.Now().Format(time.RFC3339),
		ProcesoId:     contexto.ProcesoID,
		NombreProceso: "Subproceso",
		Canal:         canalCodigo,
		TipoObjeto:    "subproceso",
		NombreObjeto:  nodoID,
		Parametros:    parametrosEntrada,
		Resultado:     resultadoSub.Salidas,
		Estado:        "completado",
		DuracionMs:    resultadoSub.DuracionMs,
	})

	// Retornar asignaciones para propagación
	asignaciones := make(map[string]interface{})
	for k, v := range resultadoSub.Salidas {
		asignaciones[k] = v
	}

	return resultado, asignaciones, nil
}

// ejecutarSubprocesoInterno ejecuta el proceso hijo y retorna su resultado
func ejecutarSubprocesoInterno(contexto *ContextoSubproceso, canalCodigo string) (*ResultadoSubproceso, error) {
	inicio := time.Now()
	
	// Canal para resultado con timeout
	resultChan := make(chan *ResultadoSubproceso, 1)
	errChan := make(chan error, 1)
	
	go func() {
		// Cargar el proceso hijo desde la base de datos
		var proc models.Proceso
		db := database.DBGORM
		if err := db.First(&proc, "id = ?", contexto.ProcesoID).Error; err != nil {
			errChan <- fmt.Errorf("error cargando subproceso %s: %w", contexto.ProcesoID, err)
			return
		}

		// Ejecutar el flujo del subproceso
		resultadoEjecucion, err := EjecutarFlujoConContexto(
			contexto.ProcesoID,
			contexto.Variables,
			canalCodigo,
			"subproceso",
			contexto,
		)
		
		if err != nil {
			errChan <- err
			return
		}

		// Convertir resultado a formato esperado
		resultado := &ResultadoSubproceso{
			Salidas:    resultadoEjecucion.Datos,
			Estado:     resultadoEjecucion.Estado,
			DuracionMs: time.Since(inicio).Milliseconds(),
		}

		// Si hay error, extraer campos de error
		if resultadoEjecucion.Estado == 99 || resultadoEjecucion.Estado == 98 {
			if codigo, ok := resultadoEjecucion.Datos["codigoError"].(string); ok {
				resultado.CodigoError = codigo
			}
			if mensaje, ok := resultadoEjecucion.Datos["mensajeError"].(string); ok {
				resultado.MensajeError = mensaje
			}
			if detalle, ok := resultadoEjecucion.Datos["detalleError"].(string); ok {
				resultado.DetalleError = detalle
			}
		}

		resultChan <- resultado
	}()

	// Esperar con timeout
	select {
	case resultado := <-resultChan:
		return resultado, nil
	case err := <-errChan:
		return nil, err
	case <-time.After(contexto.Timeout):
		return nil, fmt.Errorf("timeout ejecutando subproceso %s después de %v", contexto.ProcesoID, contexto.Timeout)
	}
}

// EjecutarFlujoConContexto es una versión extendida de EjecutarFlujo que acepta contexto
func EjecutarFlujoConContexto(
	procesoID string,
	input map[string]interface{},
	canalCodigo string,
	trigger string,
	contexto *ContextoSubproceso,
) (ResultadoEjecucion, error) {
	// Por ahora, delegar a la función original
	// TODO: Modificar EjecutarFlujo para aceptar contexto opcional
	return EjecutarFlujo(procesoID, input, canalCodigo, trigger)
}
