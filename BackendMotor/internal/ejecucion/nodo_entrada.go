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
}

// ejecutarNodoEntrada procesa los campos del nodo de tipo entrada
func ejecutarNodoEntrada(n estructuras.NodoGenerico, input map[string]interface{}) (map[string]interface{}, map[string]interface{}, error) {
	camposJSON, _ := json.Marshal(n.Data["campos"])
	var camposEntrada []NodoCampoEntrada
	json.Unmarshal(camposJSON, &camposEntrada)

	resultado := make(map[string]interface{})
	asignaciones := make(map[string]interface{})

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

	// Validar campos requeridos
	if asig.Tabla == "" || asig.Clave == "" || asig.Campo == "" {
		return nil, fmt.Errorf("asignación de tabla requiere tabla, clave y campo")
	}

	// Convertir a AsignacionAvanzada para usar el resolver
	asignacionAvanzada := AsignacionAvanzada{
		Tipo:            asig.Tipo,
		Tabla:           asig.Tabla,
		Clave:           asig.Clave,
		Campo:           asig.Campo,
		EsClaveVariable: asig.EsClaveVariable,
	}

	return ResolverAsignacionTabla(asignacionAvanzada, ctx)
}
