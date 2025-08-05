package ejecucion

import (
	"backendmotor/internal/estructuras"
	"encoding/json"
	"fmt"
)

// Estructura de cada campo esperado por el nodo salidaError
type CampoSalidaError struct {
	Nombre string `json:"nombre"`
	Tipo   string `json:"tipo"`
}

// ejecutarNodoSalidaError copia los valores definidos como `parametrosEntrada` del nodo tipo salidaError
// desde el contexto `resultado` hacia la respuesta final del proceso
func ejecutarNodoSalidaError(
	n estructuras.NodoGenerico, // nodo actual tipo "salidaError"
	resultado map[string]interface{}, // variables acumuladas durante el flujo
) (
	map[string]interface{}, // respuesta final con los campos de error
	map[string]interface{}, // asignaciones realizadas (para trazabilidad)
) {
	// 🧠 Paso 1: Extraer definición de parámetros de entrada desde n.Data["parametrosEntrada"]
	parametrosJSON, _ := json.Marshal(n.Data["parametrosEntrada"])

	var parametros []CampoSalidaError
	json.Unmarshal(parametrosJSON, &parametros)

	// 📦 Estructuras auxiliares de retorno
	respuestaFinal := make(map[string]interface{})
	asignaciones := make(map[string]interface{})

	// 🔄 Paso 2: Buscar cada campo definido y copiarlo desde resultado si existe
	for _, p := range parametros {
		if val, ok := resultado[p.Nombre]; ok {
			respuestaFinal[p.Nombre] = val
			asignaciones[p.Nombre] = val
			fmt.Printf("🧩 Nodo salidaError: asignado %s = %v\n", p.Nombre, val)
		} else {
			fmt.Printf("⚠️ Nodo salidaError: valor no encontrado para %s\n", p.Nombre)
		}
	}

	// ✅ Paso final: retornamos los datos de respuesta final
	return respuestaFinal, asignaciones
}
