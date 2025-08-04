package ejecutores

import (
	"backendmotor/internal/models"
	"database/sql"
	"encoding/json"
	"fmt"

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
