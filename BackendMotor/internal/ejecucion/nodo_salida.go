package ejecucion

import (
	"backendmotor/internal/estructuras"
	"encoding/json"
	"fmt"
)

// Estructura interna de una asignación dentro del nodo salida
type AsignacionSalida struct {
	Destino string `json:"destino"`
	Tipo    string `json:"tipo"`
	Valor   string `json:"valor"`
}

// ejecutarNodoSalida realiza las asignaciones finales para construir la respuesta del flujo
func ejecutarNodoSalida(
	n estructuras.NodoGenerico, // nodo actual de tipo "salida"
	resultado map[string]interface{}, // contexto global con todos los valores
) (
	map[string]interface{}, // respuesta final construida
	map[string]interface{}, // asignaciones realizadas (para log o auditoría)
	error, // error en caso de fallo
) {
	// 🧠 Paso 1: Extraer el bloque de asignaciones del nodo (esperado como JSON)
	asignacionesJSON, _ := json.Marshal(n.Data["asignaciones"])

	// 🧠 Paso 2: Mapear asignaciones agrupadas (pueden estar por grupo o sección)
	var asignaciones map[string][]AsignacionSalida
	json.Unmarshal(asignacionesJSON, &asignaciones)

	// 📦 Estructuras auxiliares
	respuestaFinal := make(map[string]interface{})
	asignacionesAplicadas := make(map[string]interface{})

	// 🔄 Paso 3: Recorrer todas las asignaciones
	for _, asigns := range asignaciones {
		for _, asign := range asigns {

			// 🔁 Tipo: campo → copiar desde variable existente en resultado
			if asign.Tipo == "campo" {
				if val, ok := resultado[asign.Valor]; ok {
					respuestaFinal[asign.Destino] = val
					asignacionesAplicadas[asign.Destino] = val
				} else {
					fmt.Printf("⚠️ Valor no encontrado en contexto: %s\n", asign.Valor)
				}

				// 🔁 Tipo: literal → asignar valor directamente
			} else if asign.Tipo == "literal" {
				respuestaFinal[asign.Destino] = asign.Valor
				asignacionesAplicadas[asign.Destino] = asign.Valor
			}
		}
	}

	// ✅ Paso final: retornar la respuesta y las asignaciones realizadas
	return respuestaFinal, asignacionesAplicadas, nil
}
