package ejecucion

import (
	"encoding/json"
	"fmt"
	"time"

	"backendmotor/internal/ejecucion/ejecutores"
	"backendmotor/internal/models"
	"backendmotor/internal/utils"

	"gorm.io/gorm"
)

// 📦 Representación estructurada del nodo tipo "proceso"
type NodoProceso struct {
	Label             string `json:"label"`
	ServidorID        string `json:"servidorId"`
	TipoObjeto        string `json:"tipoObjeto"` // plpgsql_function, plpgsql_procedure, etc.
	Objeto            string `json:"objeto"`     // nombre real del SP o función
	ParametrosEntrada []struct {
		Nombre string `json:"nombre"`
		Tipo   string `json:"tipo"`
	} `json:"parametrosEntrada"`
	ParametrosSalida []struct {
		Nombre string `json:"nombre"`
		Tipo   string `json:"tipo"`
	} `json:"parametrosSalida"`
}

// 🧠 Función principal para ejecutar un nodo tipo "proceso"
func ejecutarNodoProceso(
	n NodoGenerico,
	resultado map[string]interface{}, // variables actuales del flujo
	input map[string]interface{}, // input original recibido por el canal
	db *gorm.DB, // conexión GORM
	canalCodigo string, // código del canal (para logs)
	proc models.Proceso, // proceso actual (estructura completa)
	inicio time.Time, // marca de inicio de ejecución (para calcular duración)
) (
	map[string]interface{}, // resultado actualizado (con salidas y fullOutput)
	map[string]interface{}, // fullOutput como map
	map[string]interface{}, // asignaciones aplicadas
	int, string, // estadoFinal, mensajeFinal
	error, // error real si ocurrió
) {
	asignaciones := make(map[string]interface{})
	fullOutput := make(map[string]interface{})
	estadoFinal := 0
	mensajeFinal := "Ejecución completada"

	// 🔍 Paso 1: Parsear los datos internos del nodo proceso
	var nodo NodoProceso
	jsonBytes, _ := json.Marshal(n.Data)
	json.Unmarshal(jsonBytes, &nodo)

	// 🔌 Paso 2: Buscar el servidor correspondiente desde la base de datos
	var servidor models.Servidor
	if err := db.First(&servidor, "id = ?", nodo.ServidorID).Error; err != nil {
		return resultado, fullOutput, asignaciones, 99, "Servidor no encontrado", fmt.Errorf("servidor no encontrado: %w", err)
	}

	// 🔧 Paso 3: Crear el ejecutor adecuado (PostgreSQL en este caso)
	ejecutor, err := ejecutores.NuevoEjecutorPostgreSQL(&servidor)
	if err != nil {
		return resultado, fullOutput, asignaciones, 99, "Error al conectar al servidor", fmt.Errorf("error al conectar al servidor: %w", err)
	}

	// 🧪 Paso 4: Preparar parámetros de entrada desde resultado o input original
	params := map[string]interface{}{}
	for _, p := range nodo.ParametrosEntrada {
		if _, existe := resultado[p.Nombre]; !existe {
			if val, ok := input[p.Nombre]; ok {
				resultado[p.Nombre] = val
				asignaciones[p.Nombre] = val
			}
		}
		if val, ok := resultado[p.Nombre]; ok {
			params[p.Nombre] = val
		}
	}

	// ⚙️ Paso 5: Ejecutar el objeto (función o procedimiento)
	var fullOutputStr string
	var execErr error
	if nodo.TipoObjeto == "plpgsql_function" {
		fullOutputStr, execErr = ejecutor.EjecutarFuncion(nodo.Objeto, params)
	} else if nodo.TipoObjeto == "plpgsql_procedure" {
		fullOutputStr, execErr = ejecutor.EjecutarProcedimiento(nodo.Objeto, params)
	} else {
		return resultado, fullOutput, asignaciones, 99, "Tipo de objeto no soportado", fmt.Errorf("tipo de objeto no soportado: %s", nodo.TipoObjeto)
	}

	// 📦 Paso 6: Parsear la respuesta (fullOutput) y asignar resultados al contexto
	json.Unmarshal([]byte(fullOutputStr), &fullOutput)
	resultado["fullOutput_"+n.ID] = fullOutput
	resultado["fullOutput"] = fullOutput // para compatibilidad

	// 🔁 Paso 7: Mapear campos de salida desde fullOutput al resultado global
	for _, ps := range nodo.ParametrosSalida {
		if val, ok := fullOutput[ps.Nombre]; ok {
			resultado[ps.Nombre] = val
		}
	}

	// 🚨 Paso 8: Manejo de errores
	if execErr != nil {
		estadoFinal = 99
		mensajeFinal = "Error en ejecución"
		resultado["codigoError"] = "99"
		resultado["mensajeError"] = mensajeFinal
		resultado["detalleError"] = execErr.Error()
	}

	// 📝 Paso 9: Registrar en logs
	log := utils.RegistroEjecucion{
		Timestamp:     time.Now().Format(time.RFC3339),
		ProcesoId:     proc.ID,
		NombreProceso: proc.Nombre,
		Canal:         canalCodigo,
		TipoObjeto:    nodo.TipoObjeto,
		NombreObjeto:  nodo.Objeto,
		Parametros:    params,
		Resultado:     resultado,
		FullOutput:    fullOutput,
		Asignaciones:  asignaciones,
		DuracionMs:    time.Since(inicio).Milliseconds(),
		Estado:        "exito",
	}
	if execErr != nil {
		log.Estado = "error"
		log.DetalleError = execErr.Error()
	}
	utils.RegistrarEjecucionLog(log)

	// ✅ Paso final: retornar todo lo necesario para continuar el flujo
	return resultado, fullOutput, asignaciones, estadoFinal, mensajeFinal, execErr
}
