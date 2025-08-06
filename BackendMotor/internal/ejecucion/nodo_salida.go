package ejecucion

import (
	"backendmotor/internal/estructuras"
	"backendmotor/internal/functions"
	"backendmotor/internal/utils"
	"encoding/json"
	"fmt"
)

// Estructura interna de una asignación dentro del nodo salida
type AsignacionSalida struct {
	Destino         string `json:"destino"`
	Tipo            string `json:"tipo"`
	Valor           string `json:"valor"`
	// Campos específicos para tipo "tabla"
	Tabla           string `json:"tabla,omitempty"`
	Clave           string `json:"clave,omitempty"`
	Campo           string `json:"campo,omitempty"`
	EsClaveVariable bool   `json:"esClaveVariable,omitempty"`
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

				// 🚪 Tipo: sistema → ejecutar función del sistema
			} else if asign.Tipo == "sistema" {
				valor, err := resolverFuncionSistemaEnSalida(asign.Valor, resultado)
				if err != nil {
					fmt.Printf("❌ Error ejecutando función %s: %v\n", asign.Valor, err)
					respuestaFinal[asign.Destino] = nil
				} else {
					respuestaFinal[asign.Destino] = valor
					asignacionesAplicadas[asign.Destino] = valor
					fmt.Printf("✅ [nodo_salida.go] Ejecutado %s → %v\n", asign.Valor, valor)
				}

				// 🗃️ Tipo: tabla → consultar tabla del sistema
			} else if asign.Tipo == "tabla" {
				valor, err := resolverTablaEnSalida(asign, resultado)
				if err != nil {
					fmt.Printf("❌ Error consultando tabla %s: %v\n", asign.Tabla, err)
					respuestaFinal[asign.Destino] = nil
				} else {
					respuestaFinal[asign.Destino] = valor
					asignacionesAplicadas[asign.Destino] = valor
					fmt.Printf("✅ [nodo_salida.go] Tabla consultada %s[%s].%s → %v\n", asign.Tabla, asign.Clave, asign.Campo, valor)
				}
			}
		}
	}

	// ✅ Paso final: retornar la respuesta y las asignaciones realizadas
	return respuestaFinal, asignacionesAplicadas, nil
}

// resolverFuncionSistemaEnSalida resuelve funciones del sistema en nodos de salida
func resolverFuncionSistemaEnSalida(expresion string, contexto map[string]interface{}) (interface{}, error) {
	// Usar la función centralizada de utils que tiene TODAS las funciones
	return utils.EjecutarFuncionSistema(expresion, contexto)
}

// resolverTablaEnSalida resuelve consultas a tablas del sistema en nodos de salida
func resolverTablaEnSalida(asign AsignacionSalida, contexto map[string]interface{}) (interface{}, error) {
	// Determinar la clave - compatibilidad con ambas estructuras
	clave := asign.Clave
	if clave == "" {
		clave = asign.Valor // Fallback para compatibilidad
	}
	
	// Validar que tenemos los campos necesarios
	if asign.Tabla == "" || clave == "" || asign.Campo == "" {
		return nil, fmt.Errorf("asignación de tabla requiere tabla, clave y campo - recibido: tabla='%s', clave='%s', campo='%s'", asign.Tabla, clave, asign.Campo)
	}

	fmt.Printf("🗃️ [nodo_salida.go] Resolviendo tabla: %s, clave: %s, campo: %s\n", asign.Tabla, clave, asign.Campo)

	// Crear resolver y ejecutar consulta
	resolver := functions.NewResolver(contexto)
	
	// Resolver la clave si es variable (viene del contexto)
	if asign.EsClaveVariable {
		if val, exists := contexto[clave]; exists {
			clave = fmt.Sprintf("%v", val)
			fmt.Printf("🔄 [nodo_salida.go] Clave variable resuelta: %s → %s\n", asign.Clave, clave)
		} else {
			return nil, fmt.Errorf("clave variable '%s' no encontrada en contexto", clave)
		}
	}

	valor, err := resolver.ResolverTabla(asign.Tabla, clave, asign.Campo)
	if err != nil {
		return nil, fmt.Errorf("error resolviendo tabla: %w", err)
	}

	return valor, nil
}
