package ejecucion

import (
	"encoding/json"
	"fmt"
	"time"

	"backendmotor/internal/database"
	"backendmotor/internal/ejecucion/ejecutores"
	"backendmotor/internal/models"
	"backendmotor/internal/utils"
)

func EjecutarCanal(procesoID string, input map[string]interface{}, canalCodigo string, trigger string) (ResultadoEjecucion, error) {
	inicio := time.Now()

	erroresPorNodo := map[string]bool{}

	var proc models.Proceso
	db := database.DBGORM
	if err := db.First(&proc, "id = ?", procesoID).Error; err != nil {
		return ResultadoEjecucion{}, fmt.Errorf("error cargando proceso: %w", err)
	}

	var flujo struct {
		Nodes []NodoGenerico `json:"nodes"`
		Edges []struct {
			ID           string `json:"id"`
			Source       string `json:"source"`
			Target       string `json:"target"`
			SourceHandle string `json:"sourceHandle"`
			TargetHandle string `json:"targetHandle"`
			Type         string `json:"type"` // <--- agregá esto
		} `json:"edges"`
	}

	if err := json.Unmarshal([]byte(proc.Flujo), &flujo); err != nil {
		return ResultadoEjecucion{}, fmt.Errorf("error parseando flujo: %w", err)
	}

	// Mapeo de nodos por ID
	nodosPorID := map[string]NodoGenerico{}
	for _, n := range flujo.Nodes {
		nodosPorID[n.ID] = n
	}

	// Mapeo de conexiones salientes por nodo
	siguientesPorID := map[string][]string{}
	for _, e := range flujo.Edges {
		siguientesPorID[e.Source] = append(siguientesPorID[e.Source], e.Target)
	}

	// Buscar nodo entrada
	var nodoEntrada NodoGenerico
	for _, n := range flujo.Nodes {
		if n.Type == "entrada" {
			nodoEntrada = n
			break
		}
	}
	if nodoEntrada.ID == "" {
		return ResultadoEjecucion{}, fmt.Errorf("no se encontró el nodo de entrada")
	}

	resultado := make(map[string]interface{})
	asignacionesAplicadas := make(map[string]interface{})
	var fullOutput map[string]interface{}
	var estadoFinal = 0
	var mensajeFinal = "Ejecución completada"
	var respuestaFinal = make(map[string]interface{})

	// Ejecutar nodo entrada
	{
		camposJSON, _ := json.Marshal(nodoEntrada.Data["campos"])
		var camposEntrada []struct {
			Nombre     string `json:"nombre"`
			Tipo       string `json:"tipo"`
			Asignacion *struct {
				Tipo           string `json:"tipo"`
				Valor          string `json:"valor"`
				CampoResultado string `json:"campoResultado"`
			} `json:"asignacion,omitempty"`
		}
		json.Unmarshal(camposJSON, &camposEntrada)

		for _, campo := range camposEntrada {
			if campo.Asignacion != nil {
				if campo.Asignacion.Tipo == "literal" {
					resultado[campo.Nombre] = campo.Asignacion.Valor
					asignacionesAplicadas[campo.Nombre] = campo.Asignacion.Valor
				} else if campo.Asignacion.Tipo == "campo" {
					if val, ok := input[campo.Asignacion.Valor]; ok {
						resultado[campo.Nombre] = val
						asignacionesAplicadas[campo.Nombre] = val
					} else {
						return ResultadoEjecucion{}, fmt.Errorf("no se encontró el valor '%s' en input", campo.Asignacion.Valor)
					}
				}
			} else if val, ok := input[campo.Nombre]; ok {
				resultado[campo.Nombre] = val
				asignacionesAplicadas[campo.Nombre] = val
			} else {
				return ResultadoEjecucion{}, fmt.Errorf("falta el campo requerido: %s", campo.Nombre)
			}
		}
	}

	// Recorrido del flujo
	queue := []string{}
	visitados := map[string]bool{}
	queue = append(queue, nodoEntrada.ID)

	for len(queue) > 0 {

		nodoID := queue[0]
		queue = queue[1:]
		if visitados[nodoID] {
			continue
		}
		visitados[nodoID] = true

		n := nodosPorID[nodoID]
		fmt.Println("🔄 Nodo en ejecución:", nodoID, "tipo:", nodosPorID[nodoID].Type)

		switch n.Type {

		case "proceso":
			var nodoProceso struct {
				Label             string `json:"label"`
				ServidorID        string `json:"servidorId"`
				TipoObjeto        string `json:"tipoObjeto"`
				Objeto            string `json:"objeto"`
				ParametrosEntrada []struct {
					Nombre string `json:"nombre"`
					Tipo   string `json:"tipo"`
				} `json:"parametrosEntrada"`
				ParametrosSalida []struct {
					Nombre string `json:"nombre"`
					Tipo   string `json:"tipo"`
				} `json:"parametrosSalida"`
			}
			jsonBytes, _ := json.Marshal(n.Data)
			json.Unmarshal(jsonBytes, &nodoProceso)

			var servidor models.Servidor
			if err := db.First(&servidor, "id = ?", nodoProceso.ServidorID).Error; err != nil {
				return ResultadoEjecucion{}, fmt.Errorf("servidor no encontrado: %w", err)
			}

			ejecutor, err := ejecutores.NuevoEjecutorPostgreSQL(&servidor)
			if err != nil {
				return ResultadoEjecucion{}, fmt.Errorf("error al conectar al servidor: %w", err)
			}

			params := map[string]interface{}{}
			for _, p := range nodoProceso.ParametrosEntrada {
				if _, existe := resultado[p.Nombre]; !existe {
					if val, ok := input[p.Nombre]; ok {
						resultado[p.Nombre] = val
						asignacionesAplicadas[p.Nombre] = val
					}
				}
				if val, ok := resultado[p.Nombre]; ok {
					params[p.Nombre] = val
				}
			}

			var fullOutputStr string
			var execErr error
			if nodoProceso.TipoObjeto == "plpgsql_function" {
				fullOutputStr, execErr = ejecutor.EjecutarFuncion(nodoProceso.Objeto, params)
			} else if nodoProceso.TipoObjeto == "plpgsql_procedure" {
				fullOutputStr, execErr = ejecutor.EjecutarProcedimiento(nodoProceso.Objeto, params)
			} else {
				return ResultadoEjecucion{}, fmt.Errorf("tipo de objeto no soportado: %s", nodoProceso.TipoObjeto)
			}

			json.Unmarshal([]byte(fullOutputStr), &fullOutput)
			resultado["fullOutput_"+n.ID] = fullOutput
			resultado["fullOutput"] = fullOutput // opcional por compatibilidad

			for _, ps := range nodoProceso.ParametrosSalida {
				if val, ok := fullOutput[ps.Nombre]; ok {
					resultado[ps.Nombre] = val
				}
			}

			// 🔴 Manejo de error con carga de parámetros de error
			if execErr != nil {

				erroresPorNodo[n.ID] = true
				estadoFinal = 99
				mensajeFinal = "Error en ejecución"
				resultado["codigoError"] = "99"
				resultado["mensajeError"] = mensajeFinal
				resultado["detalleError"] = execErr.Error()
			}

			log := utils.RegistroEjecucion{
				Timestamp:     time.Now().Format(time.RFC3339),
				ProcesoId:     proc.ID,
				NombreProceso: proc.Nombre,
				Canal:         canalCodigo,
				TipoObjeto:    nodoProceso.TipoObjeto,
				NombreObjeto:  nodoProceso.Objeto,
				Parametros:    params,
				Resultado:     resultado,
				FullOutput:    fullOutput,
				Asignaciones:  asignacionesAplicadas,
				DuracionMs:    time.Since(inicio).Milliseconds(),
				Estado:        "exito",
			}
			if execErr != nil {
				log.Estado = "error"
				log.DetalleError = execErr.Error()
			}
			utils.RegistrarEjecucionLog(log)

		case "salida":
			asignacionesJSON, _ := json.Marshal(n.Data["asignaciones"])
			var asignaciones map[string][]struct {
				Destino string `json:"destino"`
				Tipo    string `json:"tipo"`
				Valor   string `json:"valor"`
			}
			json.Unmarshal(asignacionesJSON, &asignaciones)
			for _, asigns := range asignaciones {
				for _, asign := range asigns {
					if asign.Tipo == "campo" {
						if val, ok := resultado[asign.Valor]; ok {
							respuestaFinal[asign.Destino] = val
							asignacionesAplicadas[asign.Destino] = val
						}
					} else if asign.Tipo == "literal" {
						respuestaFinal[asign.Destino] = asign.Valor
						asignacionesAplicadas[asign.Destino] = asign.Valor
					}
				}
			}
			fmt.Println("🔄 Ejecutando nodo:", n.ID, "tipo:", n.Type)

		case "salidaError":
			// Leer parametrosEntrada
			parametrosJSON, _ := json.Marshal(n.Data["parametrosEntrada"])
			var parametros []struct {
				Nombre string `json:"nombre"`
				Tipo   string `json:"tipo"`
			}
			json.Unmarshal(parametrosJSON, &parametros)

			fmt.Println("🧪 Nodo salidaError alcanzado:", n.ID)
			fmt.Println("🧪 Parametros esperados:", parametros)
			fmt.Println("🧪 Resultado actual:", resultado)
			fmt.Println("📤 RespuestaFinal generada desde salidaError:", respuestaFinal)

			for _, p := range parametros {
				if val, ok := resultado[p.Nombre]; ok {
					respuestaFinal[p.Nombre] = val
					asignacionesAplicadas[p.Nombre] = val
					fmt.Printf("🧩 Asignado: %s = %v\n", p.Nombre, val)
				} else {
					fmt.Printf("⚠️ No encontrado: %s\n", p.Nombre)
				}
			}

		}

		// Agregar siguiente(s)
		for _, e := range flujo.Edges {
			if e.Source != n.ID {
				continue
			}

			if erroresPorNodo[n.ID] {
				if e.Type == "error" {
					queue = append(queue, e.Target)
				}
			} else {
				if e.Type != "error" {
					queue = append(queue, e.Target)
				}
			}
		}

	}

	return ResultadoEjecucion{
		Estado:    estadoFinal,
		Mensaje:   mensajeFinal,
		Datos:     respuestaFinal,
		ProcesoID: proc.ID,
		Trigger:   trigger,
	}, nil
}
