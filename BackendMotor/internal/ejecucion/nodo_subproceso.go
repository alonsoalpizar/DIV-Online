package ejecucion

import (
	"fmt"
)

// ejecutarNodoSubproceso es un placeholder que avisa que aún no se implementa
func ejecutarNodoSubproceso(n NodoGenerico, resultado map[string]interface{}) (map[string]interface{}, error) {
	fmt.Printf("⚠️ Nodo Subproceso aún no implementado: %s\n", n.ID)

	// Por ahora, solo retorna los datos de entrada sin cambios
	return resultado, nil
}
