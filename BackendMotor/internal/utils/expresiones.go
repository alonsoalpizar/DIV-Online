package utils

import (
	"fmt"
	"math/rand"
	"strconv"
	"strings"
	"time"

	"backendmotor/internal/functions"

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
			resultado := time.Now().Format("02/01/2006 15:04:05")
			fmt.Printf("🕐 Función Ahora() ejecutada -> %s\n", resultado)
			return resultado, nil
		},
		"Hoy": func(args ...interface{}) (interface{}, error) {
			resultado := time.Now().Format("02/01/2006")
			fmt.Printf("📅 Función Hoy() ejecutada -> %s\n", resultado)
			return resultado, nil
		},
		"DiaSemana": func(args ...interface{}) (interface{}, error) {
			dia := int(time.Now().Weekday())
			fmt.Printf("📆 DiaSemana: Go weekday original = %d", dia)
			if dia == 0 {
				dia = 7
			}
			fmt.Printf(" -> Resultado final = %d\n", dia)
			return dia, nil
		},

		"MesActual": func(args ...interface{}) (interface{}, error) {
			resultado := int(time.Now().Month())
			fmt.Printf("🗓️  Función MesActual() ejecutada -> %d\n", resultado)
			return resultado, nil
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

		// 🗃️ FUNCIÓN TABLA (NUEVA FUNCIONALIDAD)
		// Uso: TablaValor("nombre_tabla", "clave", "campo")
		// Ejemplo: TablaValor("Estados", "01", "Descripcion") == "Activo"
		"TablaValor": func(args ...interface{}) (interface{}, error) {
			if len(args) != 3 {
				return nil, fmt.Errorf("TablaValor requiere exactamente 3 argumentos: nombre_tabla, clave, campo")
			}

			// Validar tipos de argumentos
			nombreTabla, ok1 := args[0].(string)
			if !ok1 {
				return nil, fmt.Errorf("primer argumento de TablaValor (nombre_tabla) debe ser string")
			}

			claveOriginal, ok2 := args[1].(string)
			if !ok2 {
				return nil, fmt.Errorf("segundo argumento de TablaValor (clave) debe ser string")
			}

			campo, ok3 := args[2].(string)
			if !ok3 {
				return nil, fmt.Errorf("tercer argumento de TablaValor (campo) debe ser string")
			}

			// Usar el resolver para obtener el valor
			resolver := functions.NewResolver(contexto)
			valor, err := resolver.ResolverTablaConClaveVariable(nombreTabla, claveOriginal, campo)
			if err != nil {
				return nil, fmt.Errorf("error en TablaValor: %w", err)
			}

			return valor, nil
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

// ObtenerFechaActual devuelve la fecha/hora actual
func ObtenerFechaActual() interface{} {
	return time.Now()
}

// GenerarUUID genera un nuevo UUID
func GenerarUUID() interface{} {
	return uuid.New().String()
}

// EjecutarFuncionSistema ejecuta una función del sistema individual (para usar en nodos)
func EjecutarFuncionSistema(funcion string, contexto map[string]interface{}) (interface{}, error) {
	fmt.Printf("🚀 [utils/expresiones.go] Ejecutando función: %s\n", funcion)
	
	// Reutilizar las funciones ya definidas en el map de EvaluarExpresion
	funciones := map[string]govaluate.ExpressionFunction{
		// 📅 FECHA Y HORA
		"Ahora": func(args ...interface{}) (interface{}, error) {
			resultado := time.Now().Format("02/01/2006 15:04:05")
			fmt.Printf("🕐 Función Ahora() ejecutada -> %s\n", resultado)
			return resultado, nil
		},
		"Hoy": func(args ...interface{}) (interface{}, error) {
			resultado := time.Now().Format("02/01/2006")
			fmt.Printf("📅 Función Hoy() ejecutada -> %s\n", resultado)
			return resultado, nil
		},
		"DiaSemana": func(args ...interface{}) (interface{}, error) {
			dia := int(time.Now().Weekday())
			fmt.Printf("📆 DiaSemana: Go weekday original = %d", dia)
			if dia == 0 {
				dia = 7
			}
			fmt.Printf(" -> Resultado final = %d\n", dia)
			return dia, nil
		},
		"MesActual": func(args ...interface{}) (interface{}, error) {
			resultado := int(time.Now().Month())
			fmt.Printf("🗓️  Función MesActual() ejecutada -> %d\n", resultado)
			return resultado, nil
		},
		"AnoActual": func(args ...interface{}) (interface{}, error) {
			resultado := time.Now().Year()
			fmt.Printf("📆 Función AnoActual() ejecutada -> %d\n", resultado)
			return resultado, nil
		},

		// 👤 USUARIO Y SESIÓN
		"UsuarioActual": func(args ...interface{}) (interface{}, error) {
			if val, ok := contexto["__usuario"]; ok {
				fmt.Printf("👤 Función UsuarioActual() ejecutada -> %v\n", val)
				return val, nil
			}
			fmt.Printf("👤 Función UsuarioActual() ejecutada -> (vacío)\n")
			return "", nil
		},
		"RolActual": func(args ...interface{}) (interface{}, error) {
			if val, ok := contexto["__rol"]; ok {
				fmt.Printf("🔐 Función RolActual() ejecutada -> %v\n", val)
				return val, nil
			}
			fmt.Printf("🔐 Función RolActual() ejecutada -> (vacío)\n")
			return "", nil
		},

		// ⚙️ SISTEMA
		"NombreProceso": func(args ...interface{}) (interface{}, error) {
			if val, ok := contexto["__nombreProceso"]; ok {
				fmt.Printf("⚙️ Función NombreProceso() ejecutada -> %v\n", val)
				return val, nil
			}
			fmt.Printf("⚙️ Función NombreProceso() ejecutada -> (vacío)\n")
			return "", nil
		},
		"IDFlujo": func(args ...interface{}) (interface{}, error) {
			if val, ok := contexto["__idFlujo"]; ok {
				fmt.Printf("🆔 Función IDFlujo() ejecutada -> %v\n", val)
				return val, nil
			}
			fmt.Printf("🆔 Función IDFlujo() ejecutada -> (vacío)\n")
			return "", nil
		},

		// 🔄 UTILIDAD
		"UUID": func(args ...interface{}) (interface{}, error) {
			resultado := uuid.New().String()
			fmt.Printf("🆔 Función UUID() ejecutada -> %s\n", resultado)
			return resultado, nil
		},
		"Random": func(args ...interface{}) (interface{}, error) {
			resultado := rand.Float64()
			fmt.Printf("🎲 Función Random() ejecutada -> %f\n", resultado)
			return resultado, nil
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
			resultado := string(r[ini : ini+lon])
			fmt.Printf("✂️ Función SubTexto() ejecutada -> %s\n", resultado)
			return resultado, nil
		},
		"Longitud": func(args ...interface{}) (interface{}, error) {
			if len(args) != 1 {
				return 0, fmt.Errorf("longitud requiere 1 parámetro")
			}
			texto, _ := args[0].(string)
			resultado := len([]rune(texto))
			fmt.Printf("📏 Función Longitud() ejecutada -> %d\n", resultado)
			return resultado, nil
		},
		"TextoEnMayusculas": func(args ...interface{}) (interface{}, error) {
			if len(args) != 1 {
				return "", fmt.Errorf("TextoEnMayusculas requiere 1 parámetro")
			}
			texto, _ := args[0].(string)
			resultado := strings.ToUpper(texto)
			fmt.Printf("🔤 Función TextoEnMayusculas() ejecutada -> %s\n", resultado)
			return resultado, nil
		},

		// 🔍 FUNCIONES TIPO CONTAINS
		"incluye": func(args ...interface{}) (interface{}, error) {
			if len(args) != 2 {
				return false, fmt.Errorf("incluye necesita 2 argumentos")
			}
			s, ok1 := args[0].(string)
			sub, ok2 := args[1].(string)
			resultado := ok1 && ok2 && strings.Contains(s, sub)
			fmt.Printf("🔍 Función incluye() ejecutada -> %v\n", resultado)
			return resultado, nil
		},
		"empiezaCon": func(args ...interface{}) (interface{}, error) {
			if len(args) != 2 {
				return false, fmt.Errorf("empiezaCon necesita 2 argumentos")
			}
			s, ok1 := args[0].(string)
			prefix, ok2 := args[1].(string)
			resultado := ok1 && ok2 && strings.HasPrefix(s, prefix)
			fmt.Printf("🔍 Función empiezaCon() ejecutada -> %v\n", resultado)
			return resultado, nil
		},
		"terminaCon": func(args ...interface{}) (interface{}, error) {
			if len(args) != 2 {
				return false, fmt.Errorf("terminaCon necesita 2 argumentos")
			}
			s, ok1 := args[0].(string)
			suffix, ok2 := args[1].(string)
			resultado := ok1 && ok2 && strings.HasSuffix(s, suffix)
			fmt.Printf("🔍 Función terminaCon() ejecutada -> %v\n", resultado)
			return resultado, nil
		},

		// 🗃️ FUNCIÓN TABLA
		"TablaValor": func(args ...interface{}) (interface{}, error) {
			if len(args) != 3 {
				return nil, fmt.Errorf("TablaValor requiere exactamente 3 argumentos: nombre_tabla, clave, campo")
			}

			nombreTabla, ok1 := args[0].(string)
			if !ok1 {
				return nil, fmt.Errorf("primer argumento de TablaValor (nombre_tabla) debe ser string")
			}

			claveOriginal, ok2 := args[1].(string)
			if !ok2 {
				return nil, fmt.Errorf("segundo argumento de TablaValor (clave) debe ser string")
			}

			campo, ok3 := args[2].(string)
			if !ok3 {
				return nil, fmt.Errorf("tercer argumento de TablaValor (campo) debe ser string")
			}

			resolver := functions.NewResolver(contexto)
			valor, err := resolver.ResolverTablaConClaveVariable(nombreTabla, claveOriginal, campo)
			if err != nil {
				return nil, fmt.Errorf("error en TablaValor: %w", err)
			}
			fmt.Printf("🗃️ Función TablaValor() ejecutada -> %v\n", valor)
			return valor, nil
		},
	}

	// Buscar la función sin paréntesis
	nombreFuncion := strings.TrimSuffix(funcion, "()")
	if funcionImpl, existe := funciones[nombreFuncion]; existe {
		// Ejecutar la función (sin parámetros para funciones simples)
		return funcionImpl()
	}

	return nil, fmt.Errorf("función del sistema no encontrada: %s", funcion)
}
