package ejecucion

import (
	"backendmotor/internal/functions"
	"backendmotor/internal/utils"
	"fmt"
	"time"
)

// TipoAsignacion define los tipos de asignación soportados
type TipoAsignacion string

const (
	AsignacionLiteral TipoAsignacion = "literal" // Valor fijo: "PENDIENTE"
	AsignacionCampo   TipoAsignacion = "campo"   // Del input: cliente_id
	AsignacionFuncion TipoAsignacion = "funcion" // Función del sistema: Ahora()
	AsignacionTabla   TipoAsignacion = "tabla"   // Tabla local: Estados["01"].Descripcion
)

// AsignacionAvanzada representa una asignación extendida que soporta múltiples fuentes
type AsignacionAvanzada struct {
	// Campos básicos (mantienen compatibilidad)
	Tipo           string `json:"tipo"`                     // "literal", "campo", "funcion", "tabla"
	Valor          string `json:"valor,omitempty"`          // Para literal, campo, funcion
	CampoResultado string `json:"campoResultado,omitempty"` // Compatibilidad con estructura actual

	// Campos específicos para tabla (nuevos)
	Tabla          string `json:"tabla,omitempty"`          // Nombre de la tabla
	Clave          string `json:"clave,omitempty"`          // Clave para buscar en tabla
	Campo          string `json:"campo,omitempty"`          // Campo a extraer del registro
	EsClaveVariable bool  `json:"esClaveVariable,omitempty"` // Si la clave viene del contexto
}

// AsignacionLegacy representa la estructura actual (para compatibilidad total)
type AsignacionLegacy struct {
	Tipo           string `json:"tipo"`
	Valor          string `json:"valor"`
	CampoResultado string `json:"campoResultado"`
}

// ResolverAsignacion resuelve una asignación y devuelve el valor correspondiente
func ResolverAsignacion(asig AsignacionAvanzada, ctx map[string]interface{}) (interface{}, error) {
	tipoAsig := TipoAsignacion(asig.Tipo)

	switch tipoAsig {
	case AsignacionLiteral:
		// Valor fijo
		return asig.Valor, nil

	case AsignacionCampo:
		// Valor desde el contexto/input
		if val, exists := ctx[asig.Valor]; exists {
			return val, nil
		}
		return nil, fmt.Errorf("campo '%s' no encontrado en el contexto", asig.Valor)

	case AsignacionFuncion:
		// Evaluar expresión/función del sistema
		return EvaluarFuncionDelSistema(asig.Valor, ctx)

	case AsignacionTabla:
		// Consulta a tabla local
		return ResolverAsignacionTabla(asig, ctx)

	default:
		return nil, fmt.Errorf("tipo de asignación no soportado: %s", asig.Tipo)
	}
}

// EvaluarFuncionDelSistema evalúa una función como Ahora(), UUID(), etc.
func EvaluarFuncionDelSistema(expresion string, ctx map[string]interface{}) (interface{}, error) {
	// Para funciones simples sin comparaciones, podemos usar una evaluación directa
	// Si es una expresión más compleja, usamos el evaluador completo
	
	// Funciones simples más comunes:
	switch expresion {
	case "Ahora()":
		return utils.EvaluarExpresion("Ahora() == Ahora()", ctx) // Truco: evalúa y retorna el valor de Ahora()
	case "UUID()":
		return utils.EvaluarExpresion("UUID() != ''", ctx) // Similar truco
	}

	// Para expresiones más complejas, intentar evaluación completa
	// Nota: esto es una simplificación. Una implementación más robusta 
	// evaluaría directamente las funciones sin necesidad de comparaciones
	
	// Por ahora, intentamos evaluar como una expresión que siempre sea verdadera
	// y extraer el resultado de la función
	resultado, err := utils.EvaluarExpresion(fmt.Sprintf("(%s) != null", expresion), ctx)
	if err != nil {
		return nil, fmt.Errorf("error evaluando función '%s': %w", expresion, err)
	}
	
	// HACK temporal: ejecutar la función directamente según el tipo
	if expresion == "Ahora()" {
		fmt.Printf("🕐 Ejecutando Ahora() desde asignaciones.go\n")
		return time.Now().Format("02/01/2006 15:04:05"), nil
	}
	if expresion == "Hoy()" {
		fmt.Printf("📅 Ejecutando Hoy() desde asignaciones.go\n")
		return time.Now().Format("02/01/2006"), nil
	}
	if expresion == "DiaSemana()" {
		dia := int(time.Now().Weekday())
		if dia == 0 {
			dia = 7
		}
		fmt.Printf("📆 Ejecutando DiaSemana() desde asignaciones.go -> %d\n", dia)
		return dia, nil
	}
	if expresion == "MesActual()" {
		mes := int(time.Now().Month())
		fmt.Printf("🗓️ Ejecutando MesActual() desde asignaciones.go -> %d\n", mes)
		return mes, nil
	}
	if expresion == "UUID()" {
		return utils.GenerarUUID(), nil
	}
	
	// Para otras funciones, devolver el resultado de la evaluación
	return resultado, nil
}

// ResolverAsignacionTabla resuelve una asignación de tipo tabla
func ResolverAsignacionTabla(asig AsignacionAvanzada, ctx map[string]interface{}) (interface{}, error) {
	// Validar que tenemos los campos necesarios
	if asig.Tabla == "" || asig.Clave == "" || asig.Campo == "" {
		return nil, fmt.Errorf("asignación de tabla requiere tabla, clave y campo")
	}

	// Resolver la clave si es variable (viene del contexto)
	clave := asig.Clave
	if asig.EsClaveVariable {
		if val, exists := ctx[asig.Clave]; exists {
			clave = fmt.Sprintf("%v", val)
		} else {
			return nil, fmt.Errorf("clave variable '%s' no encontrada en contexto", asig.Clave)
		}
	}

	// Usar el resolver para obtener el valor
	resolver := functions.NewResolver(ctx)
	valor, err := resolver.ResolverTabla(asig.Tabla, clave, asig.Campo)
	if err != nil {
		return nil, fmt.Errorf("error resolviendo tabla: %w", err)
	}

	return valor, nil
}

// ConvertirAsignacionLegacy convierte una asignación legacy a la nueva estructura
// Esto mantiene compatibilidad total con el sistema actual
func ConvertirAsignacionLegacy(legacy AsignacionLegacy) AsignacionAvanzada {
	return AsignacionAvanzada{
		Tipo:           legacy.Tipo,
		Valor:          legacy.Valor,
		CampoResultado: legacy.CampoResultado,
		// Los campos específicos de tabla quedan vacíos
	}
}

// EsAsignacionCompatible verifica si una asignación es compatible con el sistema legacy
func EsAsignacionCompatible(asig AsignacionAvanzada) bool {
	tipoAsig := TipoAsignacion(asig.Tipo)
	return tipoAsig == AsignacionLiteral || tipoAsig == AsignacionCampo
}