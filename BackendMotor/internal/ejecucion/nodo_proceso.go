package ejecucion

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"backendmotor/internal/database"
	"backendmotor/internal/ejecucion/ejecutores"
	"backendmotor/internal/estructuras"
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
	n estructuras.NodoGenerico,
	resultado map[string]interface{},
	input map[string]interface{},
	db *gorm.DB,
	canalCodigo string,
	proc models.Proceso,
	inicio time.Time,
) (
	map[string]interface{},
	map[string]interface{},
	map[string]interface{},
	int, string,
	error,
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

	// 🧠 Paso 3: Detectar tipo de servidor y ejecutar
	var fullOutputStr string
	var execErr error
	tipoServidor := strings.ToLower(servidor.Tipo)

	switch tipoServidor {
	case "postgresql":
		fullOutputStr, execErr = ejecutores.EjecutarPostgreSQL(n, resultado, servidor)
	case "rest":
		fullOutputStr, execErr = ejecutores.EjecutarREST(n, resultado, servidor)
	default:
		execErr = fmt.Errorf("tipo de servidor no soportado: %s", servidor.Tipo)
		return resultado, fullOutput, asignaciones, 99, "Tipo de servidor no soportado", execErr
	}

	// 📦 Paso 4: Guardar FullOutput en resultado
	resultado["FullOutput"] = fullOutputStr
	json.Unmarshal([]byte(fullOutputStr), &fullOutput)
	resultado["fullOutput_"+n.ID] = fullOutput
	resultado["fullOutput"] = fullOutput // compatibilidad

	// ⚙️ Paso 5: Auto-generar parametrosSalida si parsearFullOutput == true
	if parsear, ok := n.Data["parsearFullOutput"].(bool); ok && parsear {
		tipoRespuesta := fmt.Sprint(n.Data["tipoRespuesta"])
		tagPadre := fmt.Sprint(n.Data["tagPadre"])

		existentesRaw, tieneExistentes := n.Data["parametrosSalida"]
		existentes := []estructuras.Campo{}
		if tieneExistentes {
			if existentesBytes, err := json.Marshal(existentesRaw); err == nil {
				_ = json.Unmarshal(existentesBytes, &existentes)
			}
		}

		nuevos, err := estructuras.MapearCamposDesdeFullOutput(fullOutputStr, tipoRespuesta, tagPadre, existentes)
		if err == nil && len(nuevos) > 0 {
			n.Data["parametrosSalida"] = nuevos
		}

		n.Data["parsearFullOutput"] = false
		_ = database.ActualizarNodoEnFlujo(n)
	}

	// 🧠 Paso 6: Si hay parametrosSalida definidos, intentar extraer valores reales
	if salidaRaw, ok := n.Data["parametrosSalida"]; ok {
		if salidaBytes, err := json.Marshal(salidaRaw); err == nil {
			var camposSalida []estructuras.Campo
			if err := json.Unmarshal(salidaBytes, &camposSalida); err == nil {
				tipoRespuesta := fmt.Sprint(n.Data["tipoRespuesta"])
				tagPadre := fmt.Sprint(n.Data["tagPadre"])
				valores, err := estructuras.ExtraerValoresDesdeFullOutput(fullOutputStr, tipoRespuesta, tagPadre, camposSalida)
				if err == nil {
					for _, campo := range camposSalida {
						if val, ok := valores[campo.Nombre]; ok {
							resultado[campo.Nombre] = val
						}
					}
				}
			}
		}
	}

	// 🚨 Paso 7: Manejo de errores
	if execErr != nil {
		estadoFinal = 99
		mensajeFinal = "Error en ejecución"
		resultado["codigoError"] = "99"
		resultado["mensajeError"] = mensajeFinal
		resultado["detalleError"] = execErr.Error()
	}

	// 📝 Paso 8: Registrar en logs
	log := utils.RegistroEjecucion{
		Timestamp:     time.Now().Format(time.RFC3339),
		ProcesoId:     proc.ID,
		NombreProceso: proc.Nombre,
		Canal:         canalCodigo,
		TipoObjeto:    nodo.TipoObjeto,
		NombreObjeto:  nodo.Objeto,
		Parametros:    input,
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

	// ✅ Retornar resultado
	return resultado, fullOutput, asignaciones, estadoFinal, mensajeFinal, execErr
}
