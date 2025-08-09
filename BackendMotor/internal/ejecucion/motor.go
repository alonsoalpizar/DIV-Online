package ejecucion

import (
	"backendmotor/internal/database"

	"backendmotor/internal/estructuras"
	"backendmotor/internal/models"
	"backendmotor/internal/utils"
	"encoding/json"
	"fmt"

	"time"
)

// EjecutarFlujo es el motor principal que interpreta y ejecuta el flujo de integración definido
func EjecutarFlujo(procesoID string, input map[string]interface{}, canalCodigo string, trigger string) (ResultadoEjecucion, error) {
	inicio := time.Now()

	// 🧱 Paso 1: Cargar el proceso desde la base de datos
	var proc models.Proceso
	db := database.DBGORM
	if err := db.First(&proc, "id = ?", procesoID).Error; err != nil {
		return ResultadoEjecucion{}, fmt.Errorf("error cargando proceso: %w", err)
	}

	// 🧠 Paso 2: Parsear el JSON del flujo
	var flujo struct {
		Nodes []estructuras.NodoGenerico `json:"nodes"`
		Edges []struct {
			ID           string `json:"id"`
			Source       string `json:"source"`
			Target       string `json:"target"`
			SourceHandle string `json:"sourceHandle"`
			TargetHandle string `json:"targetHandle"`
			Type         string `json:"type"`
		} `json:"edges"`
	}
	if err := json.Unmarshal([]byte(proc.Flujo), &flujo); err != nil {
		return ResultadoEjecucion{}, fmt.Errorf("error parseando flujo: %w", err)
	}

	// 🧩 Paso 3: Mapear nodos y conexiones
	nodosPorID := make(map[string]estructuras.NodoGenerico)
	siguientesPorID := make(map[string][]string)
	for _, n := range flujo.Nodes {
		nodosPorID[n.ID] = n
	}
	for _, e := range flujo.Edges {
		siguientesPorID[e.Source] = append(siguientesPorID[e.Source], e.Target)
	}

	// 🔍 Paso 4: Identificar nodo tipo entrada
	var nodoEntrada estructuras.NodoGenerico
	for _, n := range flujo.Nodes {
		if n.Type == "entrada" {
			nodoEntrada = n
			break
		}
	}
	if nodoEntrada.ID == "" {
		return ResultadoEjecucion{}, fmt.Errorf("no se encontró nodo de entrada")
	}

	// ▶️ Paso 5: Ejecutar nodo entrada
	resultado, asignacionesAplicadas, err := ejecutarNodoEntrada(nodoEntrada, input)
	if err != nil {
		return ResultadoEjecucion{}, fmt.Errorf("error ejecutando nodo entrada: %w", err)
	}

	// 🧪 Paso 6: Preparar estado de ejecución
	erroresPorNodo := make(map[string]bool)
	respuestaFinal := make(map[string]interface{})
	visitados := make(map[string]bool)
	pendientes := make(map[string]bool)
	
	// Inicializar con nodo de entrada
	pendientes[nodoEntrada.ID] = true

	// 🔁 Paso 7: Recorrido optimizado y ejecución de nodos del flujo
	for len(pendientes) > 0 {
		// Obtener cualquier nodo pendiente (map no garantiza orden, pero está bien)
		var nodoID string
		for id := range pendientes {
			nodoID = id
			break
		}
		
		// Remover de pendientes y marcar como visitado
		delete(pendientes, nodoID)
		visitados[nodoID] = true
		
		fmt.Printf("🔄 Procesando nodo %s (%s)\n", nodoID, nodosPorID[nodoID].Type)
		n := nodosPorID[nodoID]

		asignaciones := make(map[string]interface{})

		switch n.Type {

		case "proceso":
			// ✅ Obtener el servidorId desde n.Data
			servidorID, ok := n.Data["servidorId"].(string)
			if !ok || servidorID == "" {
				erroresPorNodo[n.ID] = true
				resultado["codigoError"] = 98
				resultado["mensajeError"] = "servidorId no definido en el nodo"
				break
			}

			// 🧠 Ejecutar el nodo tipo proceso desde módulo central
			newResultado, _, newAsignaciones, estado, _, err := ejecutarNodoProceso(n, resultado, input, db, canalCodigo, proc, inicio)
			if err != nil {
				erroresPorNodo[n.ID] = true
			}
			resultado = newResultado
			for k, v := range newAsignaciones {
				asignacionesAplicadas[k] = v
			}
			if estado == 99 {
				erroresPorNodo[n.ID] = true
			}

		case "salida":
			respuestaFinal, asignaciones, err = ejecutarNodoSalida(n, resultado)
			if err != nil {
				return ResultadoEjecucion{}, fmt.Errorf("error en nodo salida: %w", err)
			}
			for k, v := range asignaciones {
				asignacionesAplicadas[k] = v
			}

		case "salidaError":
			respuestaFinal, asignaciones = ejecutarNodoSalidaError(n, resultado)
			for k, v := range asignaciones {
				asignacionesAplicadas[k] = v
			}

		case "subproceso":
			// Crear contexto si no existe
			contexto := &ContextoSubproceso{
				ProcesoID:       proc.ID,
				ParentProcesoID: "",
				Variables:       make(map[string]interface{}),
				Globales:        input, // Pasar variables de entrada como globales
				Depth:           0,
				CallStack:       []string{},
				TraceID:         fmt.Sprintf("%s-%d", proc.ID, time.Now().UnixNano()),
				Timeout:         60 * time.Second,
				Inicio:          inicio,
			}
			
			newResultado, newAsignaciones, err := ejecutarNodoSubproceso(n, resultado, contexto, canalCodigo)
			if err != nil {
				erroresPorNodo[n.ID] = true
				resultado["codigoError"] = "SUB_ERROR"
				resultado["mensajeError"] = fmt.Sprintf("Error en subproceso: %v", err)
			} else {
				resultado = newResultado
				for k, v := range newAsignaciones {
					asignacionesAplicadas[k] = v
				}
				// Verificar si el subproceso retornó error
				if codigo, ok := resultado["codigoError"]; ok && codigo != nil && codigo != "" {
					erroresPorNodo[n.ID] = true
				}
			}
			
			// 🎯 RUTEO INTELIGENTE: Solo agregar el nodo de salida correcto según el resultado
			for _, e := range flujo.Edges {
				if e.Source != n.ID {
					continue
				}
				
				targetID := e.Target
				if visitados[targetID] || pendientes[targetID] {
					continue
				}
				
				targetNode := nodosPorID[targetID]
				
				// Si hay error en subproceso, solo agregar salidaError
				if erroresPorNodo[n.ID] && targetNode.Type == "salidaError" {
					fmt.Printf("➡️ Agregando nodo %s (salidaError por error en subproceso)\n", targetID)
					pendientes[targetID] = true
				} 
				// Si no hay error, solo agregar salida normal
				if !erroresPorNodo[n.ID] && targetNode.Type == "salida" {
					fmt.Printf("➡️ Agregando nodo %s (salida por éxito en subproceso)\n", targetID)
					pendientes[targetID] = true
				}
				// Para otros tipos de nodos (proceso, condicion, etc.) agregarlos normalmente
				if targetNode.Type != "salida" && targetNode.Type != "salidaError" {
					if !erroresPorNodo[n.ID] { // Solo si no hay error
						fmt.Printf("➡️ Agregando nodo %s (%s después de subproceso exitoso)\n", targetID, targetNode.Type)
						pendientes[targetID] = true
					}
				}
			}
			continue // No ejecutar la lógica general de agregado

		case "splitter":
			newResultado, newAsignaciones, err := ejecutarNodoSplitter(n, resultado, canalCodigo)
			if err != nil {
				erroresPorNodo[n.ID] = true
				resultado["codigoError"] = "SPLITTER_ERROR"
				resultado["mensajeError"] = fmt.Sprintf("Error en splitter: %v", err)
			} else {
				resultado = newResultado
				for k, v := range newAsignaciones {
					asignacionesAplicadas[k] = v
				}
			}

		case "condicion":
			cumple, err := ejecutarNodoCondicion(n, resultado, canalCodigo)
			if err != nil {
				return ResultadoEjecucion{}, fmt.Errorf("error en nodo condición: %w", err)
			}

			if cumple {
				if salidaRaw, ok := n.Data["parametrosSalida"]; ok {
					if salidaBytes, err := json.Marshal(salidaRaw); err == nil {
						var camposSalida []estructuras.Campo

						if err := json.Unmarshal(salidaBytes, &camposSalida); err == nil {
							for _, campo := range camposSalida {
								if val, ok := resultado[campo.Nombre]; ok {
									asignacionesAplicadas[campo.Nombre] = val
								}
							}
						}
					}
				}
			} else {
				if errorRaw, ok := n.Data["parametrosError"]; ok {
					if errorBytes, err := json.Marshal(errorRaw); err == nil {
						var camposError []estructuras.Campo
						if err := json.Unmarshal(errorBytes, &camposError); err == nil {
							for _, campo := range camposError {
								if val, ok := resultado[campo.Nombre]; ok {
									asignacionesAplicadas[campo.Nombre] = val
								}
							}
						}
					}
				}
			}

			// Agregar nodos siguientes según condición
			for _, e := range flujo.Edges {
				if e.Source != n.ID {
					continue
				}
				
				targetID := e.Target
				// Verificar que no esté ya visitado o pendiente
				if visitados[targetID] || pendientes[targetID] {
					continue
				}
				
				if (cumple && e.SourceHandle == "true") || (!cumple && e.SourceHandle == "false") {
					fmt.Printf("➡️ Agregando nodo %s (condición %v desde %s)\n", targetID, cumple, n.ID)
					pendientes[targetID] = true
				}
			}
			continue
		}

		// 🎯 ALGORITMO OPTIMIZADO: Solo agregar nodos NO visitados y NO pendientes
		for _, e := range flujo.Edges {
			if e.Source != n.ID {
				continue
			}
			
			targetID := e.Target
			// Verificar que no esté ya visitado o pendiente
			if visitados[targetID] || pendientes[targetID] {
				continue
			}
			
			// Agregar según el tipo de edge y estado del nodo
			if erroresPorNodo[n.ID] && e.Type == "error" {
				fmt.Printf("➡️ Agregando nodo %s (error desde %s)\n", targetID, n.ID)
				pendientes[targetID] = true
			} else if !erroresPorNodo[n.ID] && e.Type != "error" {
				fmt.Printf("➡️ Agregando nodo %s (normal desde %s)\n", targetID, n.ID)
				pendientes[targetID] = true
			}
		}
	}

	// ✅ Paso final: validar si se ejecutó algún nodo salida
	if len(respuestaFinal) == 0 {
		utils.RegistrarEjecucionLog(utils.RegistroEjecucion{
			Timestamp:     time.Now().Format(time.RFC3339),
			ProcesoId:     proc.ID,
			NombreProceso: proc.Nombre,
			Canal:         canalCodigo,
			TipoObjeto:    "motor",
			NombreObjeto:  "Validación final de respuesta",
			Parametros: map[string]interface{}{
				"visitados": visitados,
				"errores":   erroresPorNodo,
			},
			Resultado: map[string]interface{}{
				"estadoFinal":    "sin salida",
				"trigger":        trigger,
				"respuestaFinal": respuestaFinal,
			},
			FullOutput: map[string]interface{}{
				"nodosSalidaDetectados":      nodosDeTipo(flujo.Nodes, "salida"),
				"nodosSalidaErrorDetectados": nodosDeTipo(flujo.Nodes, "salidaError"),
				"flujoID":                    proc.ID,
			},
			Estado:     "flujo_incompleto",
			DuracionMs: time.Since(inicio).Milliseconds(),
		})

		return ResultadoEjecucion{
			Estado:    98,
			Mensaje:   "No se ejecutó ningún nodo de salida. Flujo incompleto.",
			Datos:     nil,
			ProcesoID: proc.ID,
			Trigger:   trigger,
		}, nil
	}

	utils.RegistrarEjecucionLog(utils.RegistroEjecucion{
		Timestamp:     time.Now().Format(time.RFC3339),
		ProcesoId:     proc.ID,
		NombreProceso: proc.Nombre,
		Canal:         canalCodigo,
		TipoObjeto:    "motor",
		NombreObjeto:  "Ejecución exitosa",
		Parametros:    resultado,
		Resultado:     respuestaFinal,
		FullOutput: map[string]interface{}{
			"flujoID":   proc.ID,
			"trigger":   trigger,
			"estado":    "exito",
			"visitados": visitados,
		},
		Estado:     "ok",
		DuracionMs: time.Since(inicio).Milliseconds(),
	})

	return ResultadoEjecucion{
		Estado:    0,
		Mensaje:   "Ejecución completada",
		Datos:     respuestaFinal,
		ProcesoID: proc.ID,
		Trigger:   trigger,
	}, nil
}

// 🔧 Función auxiliar para detectar nodos de cierto tipo
func nodosDeTipo(nodos []estructuras.NodoGenerico, tipo string) []string {
	var encontrados []string
	for _, n := range nodos {
		if n.Type == tipo {
			encontrados = append(encontrados, n.ID)
		}
	}
	return encontrados
}
