package utils

import (
	"fmt"
	"math/rand"
	"strconv"
	"strings"
	"time"

	"github.com/Knetic/govaluate"
	"github.com/google/uuid"
)

// EvaluarExpresion evalúa una expresión lógica con soporte de funciones y operadores personalizados
func EvaluarExpresion(expr string, contexto map[string]interface{}) (bool, error) {
	// 🔄 Reemplazo textual para operadores lógicos visuales
	expr = strings.ReplaceAll(expr, " Y ", " AND ")
	expr = strings.ReplaceAll(expr, " O ", " OR ")
	expr = strings.ReplaceAll(expr, " y ", " AND ")
	expr = strings.ReplaceAll(expr, " o ", " OR ")
	// 🔄 Reemplazo textual para operadores lógicos visuales
	expr = strings.ReplaceAll(expr, " AND ", " && ")
	expr = strings.ReplaceAll(expr, " and ", " && ")
	expr = strings.ReplaceAll(expr, " OR ", " || ")
	expr = strings.ReplaceAll(expr, " or ", " || ")

	// 🛠️ Asegurar que los operadores básicos estén correctamente representados
	expr = strings.ReplaceAll(expr, "==", "==")
	expr = strings.ReplaceAll(expr, "!=", "!=")
	expr = strings.ReplaceAll(expr, ">=", ">=")
	expr = strings.ReplaceAll(expr, "<=", "<=")
	expr = strings.ReplaceAll(expr, ">", ">")
	expr = strings.ReplaceAll(expr, "<", "<")

	// 🔍 Reemplazo textual para funciones que necesitan paréntesis
	expr = strings.ReplaceAll(expr, "incluye", "incluye(")
	expr = strings.ReplaceAll(expr, "empiezaCon", "empiezaCon(")
	expr = strings.ReplaceAll(expr, "terminaCon", "terminaCon(")

	// 📦 Definición de funciones del sistema
	funciones := map[string]govaluate.ExpressionFunction{
		// 📅 FECHA Y HORA
		"Ahora": func(args ...interface{}) (interface{}, error) {
			return time.Now(), nil
		},
		"Hoy": func(args ...interface{}) (interface{}, error) {
			t := time.Now()
			return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location()), nil
		},
		"DiaSemana": func(args ...interface{}) (interface{}, error) {
			dia := int(time.Now().Weekday())
			if dia == 0 {
				return 7, nil
			}
			return dia, nil
		},
		"MesActual": func(args ...interface{}) (interface{}, error) {
			return int(time.Now().Month()), nil
		},
		"AnoActual": func(args ...interface{}) (interface{}, error) {
			return time.Now().Year(), nil
		},

		// 👤 USUARIO Y SESIÓN
		"UsuarioActual": func(args ...interface{}) (interface{}, error) {
			if val, ok := contexto["__usuario"]; ok {
				return val, nil
			}
			return "", nil
		},
		"RolActual": func(args ...interface{}) (interface{}, error) {
			if val, ok := contexto["__rol"]; ok {
				return val, nil
			}
			return "", nil
		},

		// ⚙️ SISTEMA
		"NombreProceso": func(args ...interface{}) (interface{}, error) {
			if val, ok := contexto["__nombreProceso"]; ok {
				return val, nil
			}
			return "", nil
		},
		"IDFlujo": func(args ...interface{}) (interface{}, error) {
			if val, ok := contexto["__idFlujo"]; ok {
				return val, nil
			}
			return "", nil
		},

		// 🔄 UTILIDAD
		"UUID": func(args ...interface{}) (interface{}, error) {
			return uuid.New().String(), nil
		},
		"Random": func(args ...interface{}) (interface{}, error) {
			return rand.Float64(), nil
		},

		// 📝 TEXTO
		"SubTexto": func(args ...interface{}) (interface{}, error) {
			if len(args) != 3 {
				return "", fmt.Errorf("SubTexto requiere 3 parámetros")
			}
			texto, _ := args[0].(string)
			inicio, _ := args[1].(float64)
			longitud, _ := args[2].(float64)
			r := []rune(texto)
			ini := int(inicio)
			lon := int(longitud)
			if ini < 0 || ini+lon > len(r) {
				return "", nil
			}
			return string(r[ini : ini+lon]), nil
		},
		"Longitud": func(args ...interface{}) (interface{}, error) {
			if len(args) != 1 {
				return 0, fmt.Errorf("longitud requiere 1 parámetro")
			}
			texto, _ := args[0].(string)
			return len([]rune(texto)), nil
		},
		"TextoEnMayusculas": func(args ...interface{}) (interface{}, error) {
			if len(args) != 1 {
				return "", fmt.Errorf("TextoEnMayusculas requiere 1 parámetro")
			}
			texto, _ := args[0].(string)
			return strings.ToUpper(texto), nil
		},

		// 🔍 FUNCIONES TIPO CONTAINS
		"incluye": func(args ...interface{}) (interface{}, error) {
			if len(args) != 2 {
				return false, fmt.Errorf("incluye necesita 2 argumentos")
			}
			s, ok1 := args[0].(string)
			sub, ok2 := args[1].(string)
			return ok1 && ok2 && strings.Contains(s, sub), nil
		},
		"empiezaCon": func(args ...interface{}) (interface{}, error) {
			if len(args) != 2 {
				return false, fmt.Errorf("empiezaCon necesita 2 argumentos")
			}
			s, ok1 := args[0].(string)
			prefix, ok2 := args[1].(string)
			return ok1 && ok2 && strings.HasPrefix(s, prefix), nil
		},
		"terminaCon": func(args ...interface{}) (interface{}, error) {
			if len(args) != 2 {
				return false, fmt.Errorf("terminaCon necesita 2 argumentos")
			}
			s, ok1 := args[0].(string)
			suffix, ok2 := args[1].(string)
			return ok1 && ok2 && strings.HasSuffix(s, suffix), nil
		},
	}

	// ⚙️ Compilar y evaluar la expresión
	expresion, err := govaluate.NewEvaluableExpressionWithFunctions(expr, funciones)
	if err != nil {
		return false, fmt.Errorf("error al compilar expresión: %w", err)
	}

	resultado, err := expresion.Evaluate(contexto)
	if err != nil {
		return false, fmt.Errorf("error al evaluar expresión: %w", err)
	}

	booleano, ok := resultado.(bool)
	if !ok {
		return false, fmt.Errorf("la expresión no devolvió un valor booleano")
	}

	return booleano, nil
}

// Campo representa los campos definidos en el nodo
type Campo struct {
	Nombre string `json:"nombre"`
	Tipo   string `json:"tipo"`
}

// Normaliza el contexto según los tipos definidos en parametrosEntrada
func NormalizarContextoSegunTipos(parametros []Campo, contexto map[string]interface{}) map[string]interface{} {
	copia := make(map[string]interface{})
	for k, v := range contexto {
		copia[k] = v
	}

	for _, p := range parametros {
		val, ok := contexto[p.Nombre]
		if !ok {
			continue
		}

		switch p.Tipo {
		case "int":
			switch v := val.(type) {
			case string:
				if num, err := strconv.Atoi(v); err == nil {
					copia[p.Nombre] = num
				}
			case float64:
				copia[p.Nombre] = int(v)
			}
		case "float":
			switch v := val.(type) {
			case string:
				if num, err := strconv.ParseFloat(v, 64); err == nil {
					copia[p.Nombre] = num
				}
			case int:
				copia[p.Nombre] = float64(v)
			}
		case "boolean":
			switch v := val.(type) {
			case string:
				copia[p.Nombre] = v == "true" || v == "1"
			}
		}
	}

	return copia
}
