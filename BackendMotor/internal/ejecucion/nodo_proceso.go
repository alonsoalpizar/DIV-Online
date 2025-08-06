package ejecucion

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"backendmotor/internal/database"
	"backendmotor/internal/ejecucion/ejecutores"
	"backendmotor/internal/estructuras"
	"backendmotor/internal/functions"
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

	// 📋 Paso 2.5: Procesar asignaciones de parámetros de entrada
	parametrosResueltos, err := procesarAsignacionesParametros(n, resultado)
	if err != nil {
		return resultado, fullOutput, asignaciones, 99, "Error procesando asignaciones", fmt.Errorf("error procesando asignaciones: %w", err)
	}
	// Actualizar el resultado con los parámetros resueltos para que estén disponibles para el ejecutor
	for k, v := range parametrosResueltos {
		resultado[k] = v
		asignaciones[k] = v
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
	case "soap":
		fullOutputStr, execErr = ejecutores.EjecutarSOAP(n, resultado, servidor, proc.ID)
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
		if proc.ID != "" && len(proc.ID) > 0 {
			n.ProcesoID = proc.ID
			_ = database.ActualizarNodoEnFlujo(n)
		}
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

// Estructura para las asignaciones en nodo proceso
type AsignacionProceso struct {
	Destino         string `json:"destino"`
	Tipo            string `json:"tipo"`
	Valor           string `json:"valor"`
	// Campos específicos para tipo "tabla"
	Tabla           string `json:"tabla,omitempty"`
	Clave           string `json:"clave,omitempty"`
	Campo           string `json:"campo,omitempty"`
	EsClaveVariable bool   `json:"esClaveVariable,omitempty"`
}

// procesarAsignacionesParametros procesa las asignaciones de parámetros antes de ejecutar el SP
func procesarAsignacionesParametros(n estructuras.NodoGenerico, contexto map[string]interface{}) (map[string]interface{}, error) {
	// 🧠 Paso 1: Extraer el bloque de asignaciones del nodo
	asignacionesJSON, _ := json.Marshal(n.Data["asignaciones"])

	// 🧠 Paso 2: Mapear asignaciones agrupadas por nodo fuente
	var asignaciones map[string][]AsignacionProceso
	json.Unmarshal(asignacionesJSON, &asignaciones)

	// 📦 Estructura para parámetros resueltos
	parametrosResueltos := make(map[string]interface{})

	// 🔄 Paso 3: Recorrer todas las asignaciones
	for nodoFuente, asigns := range asignaciones {
		fmt.Printf("🔗 Procesando asignaciones desde nodo: %s\n", nodoFuente)
		
		for _, asign := range asigns {
			fmt.Printf("📝 Procesando asignación: %s = %s (%s)\n", asign.Destino, asign.Valor, asign.Tipo)

			// 🔁 Tipo: campo → copiar desde variable existente en contexto
			if asign.Tipo == "campo" {
				if val, ok := contexto[asign.Valor]; ok {
					parametrosResueltos[asign.Destino] = val
					fmt.Printf("✅ Campo resuelto: %s = %v\n", asign.Destino, val)
				} else {
					fmt.Printf("⚠️ Campo no encontrado en contexto: %s\n", asign.Valor)
				}

			// 🔁 Tipo: literal → asignar valor directamente
			} else if asign.Tipo == "literal" {
				parametrosResueltos[asign.Destino] = asign.Valor
				fmt.Printf("✅ Literal asignado: %s = %s\n", asign.Destino, asign.Valor)

			// 🚀 Tipo: sistema → ejecutar función del sistema
			} else if asign.Tipo == "sistema" {
				valor, err := resolverFuncionSistemaEnProceso(asign.Valor, contexto)
				if err != nil {
					fmt.Printf("❌ Error ejecutando función %s: %v\n", asign.Valor, err)
					return nil, fmt.Errorf("error ejecutando función %s: %w", asign.Valor, err)
				}
				parametrosResueltos[asign.Destino] = valor
				fmt.Printf("✅ [nodo_proceso.go] Función ejecutada: %s = %v\n", asign.Destino, valor)

			// 🗃️ Tipo: tabla → consultar tabla del sistema
			} else if asign.Tipo == "tabla" {
				valor, err := resolverTablaEnProceso(asign, contexto)
				if err != nil {
					fmt.Printf("❌ Error consultando tabla %s: %v\n", asign.Tabla, err)
					return nil, fmt.Errorf("error consultando tabla %s: %w", asign.Tabla, err)
				}
				parametrosResueltos[asign.Destino] = valor
				fmt.Printf("✅ [nodo_proceso.go] Tabla consultada: %s = %v\n", asign.Destino, valor)
			}
		}
	}

	return parametrosResueltos, nil
}

// resolverFuncionSistemaEnProceso resuelve funciones del sistema para parámetros de entrada
func resolverFuncionSistemaEnProceso(expresion string, contexto map[string]interface{}) (interface{}, error) {
	// Usar la función centralizada de utils que tiene TODAS las funciones
	return utils.EjecutarFuncionSistema(expresion, contexto)
}

// resolverTablaEnProceso resuelve consultas a tablas del sistema en nodos de proceso
func resolverTablaEnProceso(asign AsignacionProceso, contexto map[string]interface{}) (interface{}, error) {
	// Determinar la clave - compatibilidad con ambas estructuras
	clave := asign.Clave
	if clave == "" {
		clave = asign.Valor // Fallback para compatibilidad
	}
	
	// Validar que tenemos los campos necesarios
	if asign.Tabla == "" || clave == "" || asign.Campo == "" {
		return nil, fmt.Errorf("asignación de tabla requiere tabla, clave y campo - recibido: tabla='%s', clave='%s', campo='%s'", asign.Tabla, clave, asign.Campo)
	}

	fmt.Printf("🗃️ [nodo_proceso.go] Resolviendo tabla: %s, clave: %s, campo: %s\n", asign.Tabla, clave, asign.Campo)

	// Crear resolver y ejecutar consulta
	resolver := functions.NewResolver(contexto)
	
	// Resolver la clave si es variable (viene del contexto)
	if asign.EsClaveVariable {
		if val, exists := contexto[clave]; exists {
			clave = fmt.Sprintf("%v", val)
			fmt.Printf("🔄 [nodo_proceso.go] Clave variable resuelta: %s → %s\n", asign.Clave, clave)
		} else {
			return nil, fmt.Errorf("clave variable '%s' no encontrada en contexto", clave)
		}
	}

	valor, err := resolver.ResolverTabla(asign.Tabla, clave, asign.Campo)
	if err != nil {
		return nil, fmt.Errorf("error resolviendo tabla: %w", err)
	}

	return valor, nil
}
