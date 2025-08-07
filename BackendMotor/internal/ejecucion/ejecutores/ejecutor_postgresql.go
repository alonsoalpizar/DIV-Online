package ejecutores

import (
	"backendmotor/internal/estructuras"

	"backendmotor/internal/models"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	_ "github.com/lib/pq"
)

type EjecutorPostgreSQL struct {
	servidor *models.Servidor
	db       *sql.DB
}

func NuevoEjecutorPostgreSQL(servidor *models.Servidor) (*EjecutorPostgreSQL, error) {
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		servidor.Host, servidor.Puerto, servidor.Usuario, servidor.Clave, servidor.Extras["dbname"])

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	return &EjecutorPostgreSQL{servidor: servidor, db: db}, nil
}

// Ejecutar función fn_obtener_hora
func (e *EjecutorPostgreSQL) EjecutarFuncion(nombre string, parametros map[string]interface{}) (string, error) {
	query := fmt.Sprintf("SELECT %s()", nombre)
	var resultado string
	err := e.db.QueryRow(query).Scan(&resultado)

	fullOutput := map[string]interface{}{
		"funcion":    nombre,
		"resultado":  resultado,
		"parametros": parametros,
	}
	fullOutputJSON, _ := json.Marshal(fullOutput)

	return string(fullOutputJSON), err
}

func (e *EjecutorPostgreSQL) EjecutarProcedimiento(nombre string, parametros map[string]interface{}) (string, error) {
	paramDefs := []string{}
	paramValues := []interface{}{}
	i := 1

	for k, v := range parametros {
		paramDefs = append(paramDefs, fmt.Sprintf("%s := $%d", k, i))
		paramValues = append(paramValues, v)
		i++
	}

	query := fmt.Sprintf("CALL %s(%s)", nombre, joinStrings(paramDefs, ", "))

	_, err := e.db.Exec(query, paramValues...)

	fullOutput := map[string]interface{}{
		"procedimiento": nombre,
		"parametros":    parametros,
		"estado":        "ejecutado",
	}

	if err != nil {
		fullOutput["estado"] = "error"
		fullOutput["detalleError"] = err.Error()
	}

	fullOutputJSON, _ := json.Marshal(fullOutput)

	return string(fullOutputJSON), err
}

// Función auxiliar simple para evitar importar strings innecesariamente
func joinStrings(parts []string, sep string) string {
	result := ""
	for i, s := range parts {
		if i > 0 {
			result += sep
		}
		result += s
	}
	return result
}
func EjecutarPostgreSQL(n estructuras.NodoGenerico, resultado map[string]interface{}, servidor models.Servidor) (string, error) {
	ejecutor, err := NuevoEjecutorPostgreSQL(&servidor)
	if err != nil {
		return "", fmt.Errorf("error al conectar a PostgreSQL: %w", err)
	}

	objeto := fmt.Sprint(n.Data["objeto"])
	tipo := fmt.Sprint(n.Data["tipoObjeto"])
	if objeto == "" || tipo == "" {
		return "", fmt.Errorf("objeto o tipoObjeto no definidos en el nodo")
	}

	// 🎆 Filtrar solo parámetros que deben enviarse al servidor
	parametrosFiltrados := getParametrosFiltradosYOrdenados(n)
	
	// Crear mapa de valores solo con parámetros filtrados
	parametrosParaServidor := make(map[string]interface{})
	for _, param := range parametrosFiltrados {
		if val, existe := resultado[param.Nombre]; existe {
			parametrosParaServidor[param.Nombre] = val
		}
	}

	switch strings.ToLower(tipo) {
	case "funcion", "función", "plpgsql_function":
		return ejecutor.EjecutarFuncion(objeto, parametrosParaServidor)
	case "procedimiento", "plpgsql_procedure":
		return ejecutor.EjecutarProcedimiento(objeto, parametrosParaServidor)
	default:
		return "", fmt.Errorf("tipo de objeto no soportado para PostgreSQL: %s", tipo)
	}
}

// Estructura de parámetro para filtrado
type ParametroFiltrado struct {
	Nombre          string `json:"nombre"`
	Tipo            string `json:"tipo"`
	EnviarAServidor *bool  `json:"enviarAServidor,omitempty"`
	Orden           *int   `json:"orden,omitempty"`
}

// getParametrosFiltradosYOrdenados extrae y filtra parámetros del nodo
func getParametrosFiltradosYOrdenados(n estructuras.NodoGenerico) []ParametroFiltrado {
	var parametros []ParametroFiltrado
	
	// Extraer parámetros de entrada del nodo
	if parametrosRaw, exists := n.Data["parametrosEntrada"]; exists {
		if parametrosBytes, err := json.Marshal(parametrosRaw); err == nil {
			var parametrosCompletos []ParametroFiltrado
			if err := json.Unmarshal(parametrosBytes, &parametrosCompletos); err == nil {
				parametros = parametrosCompletos
			}
		}
	}

	// Filtrar solo los que deben enviarse al servidor
	var filtrados []ParametroFiltrado
	for _, param := range parametros {
		enviar := true // Por defecto true para retrocompatibilidad
		if param.EnviarAServidor != nil {
			enviar = *param.EnviarAServidor
		}
		
		if enviar {
			filtrados = append(filtrados, param)
		}
	}

	// Ordenar por campo orden
	for i := 0; i < len(filtrados); i++ {
		for j := i + 1; j < len(filtrados); j++ {
			ordenI := 999999 // valor alto por defecto
			ordenJ := 999999

			if filtrados[i].Orden != nil {
				ordenI = *filtrados[i].Orden
			}
			if filtrados[j].Orden != nil {
				ordenJ = *filtrados[j].Orden
			}

			if ordenI > ordenJ {
				filtrados[i], filtrados[j] = filtrados[j], filtrados[i]
			}
		}
	}

	return filtrados
}
