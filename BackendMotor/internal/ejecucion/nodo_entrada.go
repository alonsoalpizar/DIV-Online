package ejecucion

import (
	"backendmotor/internal/estructuras"
	"encoding/json"
	"fmt"
)

// NodoCampoEntrada representa la estructura de cada campo del nodo entrada
type NodoCampoEntrada struct {
	Nombre     string `json:"nombre"`
	Tipo       string `json:"tipo"`
	Asignacion *struct {
		Tipo           string `json:"tipo"`
		Valor          string `json:"valor"`
		CampoResultado string `json:"campoResultado"`
	} `json:"asignacion,omitempty"`
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
			if campo.Asignacion.Tipo == "literal" {
				resultado[campo.Nombre] = campo.Asignacion.Valor
				asignaciones[campo.Nombre] = campo.Asignacion.Valor
			} else if campo.Asignacion.Tipo == "campo" {
				if val, ok := input[campo.Asignacion.Valor]; ok {
					resultado[campo.Nombre] = val
					asignaciones[campo.Nombre] = val
				} else {
					return nil, nil, fmt.Errorf("no se encontró el valor '%s' en input", campo.Asignacion.Valor)
				}
			}
		} else if val, ok := input[campo.Nombre]; ok {
			resultado[campo.Nombre] = val
			asignaciones[campo.Nombre] = val
		} else {
			return nil, nil, fmt.Errorf("falta el campo requerido: %s", campo.Nombre)
		}
	}

	return resultado, asignaciones, nil
}
