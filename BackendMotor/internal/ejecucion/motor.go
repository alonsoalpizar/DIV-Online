package ejecucion

import (
	"encoding/json"
	"fmt"
	"time"

	"backendmotor/internal/database"
	"backendmotor/internal/models"
	"backendmotor/internal/utils"
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
		Nodes []NodoGenerico `json:"nodes"`
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
	nodosPorID := make(map[string]NodoGenerico)
	siguientesPorID := make(map[string][]string)
	for _, n := range flujo.Nodes {
		nodosPorID[n.ID] = n
	}
	for _, e := range flujo.Edges {
		siguientesPorID[e.Source] = append(siguientesPorID[e.Source], e.Target)
	}

	// 🔍 Paso 4: Identificar nodo tipo entrada
	var nodoEntrada NodoGenerico
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
	queue := []string{nodoEntrada.ID}

	// 🔁 Paso 7: Recorrido y ejecución de nodos del flujo
	for len(queue) > 0 {
		nodoID := queue[0]
		queue = queue[1:]
		if visitados[nodoID] {
			continue
		}
		visitados[nodoID] = true
		n := nodosPorID[nodoID]

		asignaciones := make(map[string]interface{})

		switch n.Type {
		case "proceso":
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

		case "condicion":
			cumple, err := ejecutarNodoCondicion(n, resultado, canalCodigo)
			if err != nil {
				return ResultadoEjecucion{}, fmt.Errorf("error en nodo condición: %w", err)
			}

			if cumple {
				if salidaRaw, ok := n.Data["parametrosSalida"]; ok {
					if salidaBytes, err := json.Marshal(salidaRaw); err == nil {
						var camposSalida []utils.Campo
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
						var camposError []utils.Campo
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

			for _, e := range flujo.Edges {
				if e.Source != n.ID {
					continue
				}
				if (cumple && e.SourceHandle == "true") || (!cumple && e.SourceHandle == "false") {
					queue = append(queue, e.Target)
				}
			}
			continue
		}

		for _, e := range flujo.Edges {
			if e.Source != n.ID {
				continue
			}
			if erroresPorNodo[n.ID] && e.Type == "error" {
				queue = append(queue, e.Target)
			}
			if !erroresPorNodo[n.ID] && e.Type != "error" {
				queue = append(queue, e.Target)
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

	return ResultadoEjecucion{
		Estado:    0,
		Mensaje:   "Ejecución completada",
		Datos:     respuestaFinal,
		ProcesoID: proc.ID,
		Trigger:   trigger,
	}, nil
}

// 🔧 Función auxiliar para detectar nodos de cierto tipo
func nodosDeTipo(nodos []NodoGenerico, tipo string) []string {
	var encontrados []string
	for _, n := range nodos {
		if n.Type == tipo {
			encontrados = append(encontrados, n.ID)
		}
	}
	return encontrados
}
