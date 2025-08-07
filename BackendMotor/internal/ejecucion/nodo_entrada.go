package ejecucion

import (
	"backendmotor/internal/estructuras"
	"backendmotor/internal/utils"
	"encoding/json"
	"fmt"
)

// AsignacionEntrada representa una asignación de campo extendida
type AsignacionEntrada struct {
	// Campos básicos (compatibilidad total con sistema actual)
	Tipo           string `json:"tipo"`
	Valor          string `json:"valor"`
	CampoResultado string `json:"campoResultado"`

	// Campos extendidos para nuevas funcionalidades (opcionales)
	Tabla           string `json:"tabla,omitempty"`           // Para tipo "tabla"
	Clave           string `json:"clave,omitempty"`           // Para tipo "tabla"
	Campo           string `json:"campo,omitempty"`           // Para tipo "tabla"
	EsClaveVariable bool   `json:"esClaveVariable,omitempty"` // Para tipo "tabla"
}

// NodoCampoEntrada representa la estructura de cada campo del nodo entrada
type NodoCampoEntrada struct {
	Nombre     string             `json:"nombre"`
	Tipo       string             `json:"tipo"`
	Asignacion *AsignacionEntrada `json:"asignacion,omitempty"`
	Orden      *int               `json:"orden,omitempty"` // Orden de ejecución
}

// ejecutarNodoEntrada procesa los campos del nodo de tipo entrada
func ejecutarNodoEntrada(n estructuras.NodoGenerico, input map[string]interface{}) (map[string]interface{}, map[string]interface{}, error) {
	camposJSON, _ := json.Marshal(n.Data["campos"])
	var camposEntrada []NodoCampoEntrada
	json.Unmarshal(camposJSON, &camposEntrada)

	resultado := make(map[string]interface{})
	asignaciones := make(map[string]interface{})

	// 🔄 Ordenar campos por el campo 'orden' antes de ejecutar asignaciones
	for i := 0; i < len(camposEntrada); i++ {
		for j := i + 1; j < len(camposEntrada); j++ {
			ordenI := 999999 // valor alto por defecto si no existe orden
			ordenJ := 999999

			if camposEntrada[i].Orden != nil {
				ordenI = *camposEntrada[i].Orden
			}
			if camposEntrada[j].Orden != nil {
				ordenJ = *camposEntrada[j].Orden
			}

			// Ordenar: menor orden primero
			if ordenI > ordenJ {
				camposEntrada[i], camposEntrada[j] = camposEntrada[j], camposEntrada[i]
			}
		}
	}

	// 🔄 Ejecutar campos en orden (CLAVE para dependencias)
	for _, campo := range camposEntrada {
		if campo.Asignacion != nil {
			// Resolver asignación usando el nuevo sistema (con compatibilidad total)
			valor, err := resolverAsignacionCampo(*campo.Asignacion, input)
			if err != nil {
				return nil, nil, fmt.Errorf("error resolviendo asignación para campo '%s': %w", campo.Nombre, err)
			}
			resultado[campo.Nombre] = valor
			asignaciones[campo.Nombre] = valor
		} else if val, ok := input[campo.Nombre]; ok {
			// Comportamiento original: campo directo del input
			resultado[campo.Nombre] = val
			asignaciones[campo.Nombre] = val
		} else {
			return nil, nil, fmt.Errorf("falta el campo requerido: %s", campo.Nombre)
		}
	}

	return resultado, asignaciones, nil
}

// resolverAsignacionCampo resuelve una asignación de campo manteniendo compatibilidad total
func resolverAsignacionCampo(asig AsignacionEntrada, input map[string]interface{}) (interface{}, error) {

	// Mantener comportamiento original para tipos existentes (COMPATIBILIDAD TOTAL)
	switch asig.Tipo {
	case "literal":
		return asig.Valor, nil
	case "campo":
		if val, ok := input[asig.Valor]; ok {
			return val, nil
		}
		return nil, fmt.Errorf("no se encontró el valor '%s' en input", asig.Valor)
	case "funcion":
		// Nueva funcionalidad: evaluar función del sistema
		return resolverFuncionDelSistema(asig.Valor, input)
	case "tabla":
		// Nueva funcionalidad: consultar tabla local
		return resolverAsignacionTablaLocal(asig, input)
	default:
		return nil, fmt.Errorf("tipo de asignación no soportado: %s", asig.Tipo)
	}
}

// resolverFuncionDelSistema resuelve funciones como Ahora(), UUID(), etc.
func resolverFuncionDelSistema(expresion string, ctx map[string]interface{}) (interface{}, error) {
	// Usar la función centralizada de utils que tiene TODAS las funciones
	return utils.EjecutarFuncionSistema(expresion, ctx)
}

// resolverAsignacionTablaLocal resuelve consultas a tablas locales
func resolverAsignacionTablaLocal(asig AsignacionEntrada, ctx map[string]interface{}) (interface{}, error) {
	// Para asignaciones de tabla, usar directamente la consulta simplificada
	// sin depender de AsignacionAvanzada por ahora (mantener compatibilidad)
	
	if asig.Tabla == "" {
		return nil, fmt.Errorf("asignación de tabla requiere especificar la tabla")
	}

	// Por ahora devolver un placeholder - la funcionalidad completa 
	// está en los ejecutores específicos (REST, SOAP, PostgreSQL)
	return fmt.Sprintf("TABLA:%s[%s].%s", asig.Tabla, asig.Valor, asig.Campo), nil
}
