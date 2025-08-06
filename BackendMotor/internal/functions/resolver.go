package functions

import (
	"backendmotor/internal/database"
	"backendmotor/internal/models"
	"encoding/json"
	"fmt"
	"strings"

	"gorm.io/gorm"
)

// FunctionResolver maneja la resolución de funciones del sistema, especialmente Tabla()
type FunctionResolver struct {
	db      *gorm.DB
	context map[string]interface{}
}

// NewResolver crea una nueva instancia del resolver de funciones
func NewResolver(ctx map[string]interface{}) *FunctionResolver {
	return &FunctionResolver{
		db:      database.DBGORM,
		context: ctx,
	}
}

// ResolverTabla maneja funciones del tipo Tabla("nombre", "clave").Campo
func (r *FunctionResolver) ResolverTabla(nombreTabla, clave, campo string) (interface{}, error) {
	if strings.TrimSpace(nombreTabla) == "" {
		return nil, fmt.Errorf("nombre de tabla no puede estar vacío")
	}
	if strings.TrimSpace(clave) == "" {
		return nil, fmt.Errorf("clave no puede estar vacía")
	}
	if strings.TrimSpace(campo) == "" {
		return nil, fmt.Errorf("campo no puede estar vacío")
	}

	// 1. Buscar tabla
	fmt.Printf("🔍 [resolver.go] Buscando tabla: %s, clave: %s, campo: %s\n", nombreTabla, clave, campo)
	
	var tabla models.Tabla
	if err := r.db.First(&tabla, "nombre = ?", nombreTabla).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("tabla '%s' no encontrada", nombreTabla)
		}
		return nil, fmt.Errorf("error accediendo a tabla '%s': %w", nombreTabla, err)
	}

	fmt.Printf("📋 [resolver.go] Tabla encontrada - Campos: %+v\n", tabla.Campos)
	fmt.Printf("📊 [resolver.go] Tabla encontrada - Datos: %+v\n", tabla.Datos)

	if len(tabla.Datos) == 0 {
		return nil, fmt.Errorf("tabla '%s' no tiene datos configurados", nombreTabla)
	}

	// 2. Deserializar tabla.Datos (que es datatypes.JSON = []byte)
	var datosDeserializados interface{}
	if err := json.Unmarshal(tabla.Datos, &datosDeserializados); err != nil {
		return nil, fmt.Errorf("error deserializando datos de tabla '%s': %w", nombreTabla, err)
	}
	
	fmt.Printf("📊 [resolver.go] Datos deserializados: %+v\n", datosDeserializados)
	fmt.Printf("🔍 [resolver.go] Tipo de datos deserializados: %T\n", datosDeserializados)

	// 3. Intentar como map (JSONMap)
	if datosMap, ok := datosDeserializados.(map[string]interface{}); ok {
		fmt.Printf("🗺️ [resolver.go] tabla.Datos es mapa, buscando clave '%s'\n", clave)
		if registro, ok := datosMap[clave]; ok {
			fmt.Printf("✅ [resolver.go] Encontrada clave '%s', buscando campo '%s'\n", clave, campo)
			if fila, ok := registro.(map[string]interface{}); ok {
				if valor, existe := fila[campo]; existe {
					fmt.Printf("🎯 [resolver.go] Valor encontrado: %v\n", valor)
					return valor, nil
				}
				fmt.Printf("❌ [resolver.go] Campo '%s' no existe en registro\n", campo)
			}
		} else {
			fmt.Printf("❌ [resolver.go] Clave '%s' no encontrada en mapa\n", clave)
		}
	}

	// 4. Intentar como arreglo de registros
	if datosArray, ok := datosDeserializados.([]interface{}); ok {
		fmt.Printf("✅ [resolver.go] tabla.Datos es array con %d elementos\n", len(datosArray))
		
		// Deserializar tabla.Campos (también es datatypes.JSON)
		var camposDeserializados interface{}
		if err := json.Unmarshal(tabla.Campos, &camposDeserializados); err != nil {
			return nil, fmt.Errorf("error deserializando campos de tabla '%s': %w", nombreTabla, err)
		}
		
		fmt.Printf("📊 [resolver.go] Campos deserializados: %+v\n", camposDeserializados)
		
		// Determinar campo clave
		campoClave := ""
		if camposArray, ok := camposDeserializados.([]interface{}); ok {
			fmt.Printf("✅ [resolver.go] Campos es array con %d elementos\n", len(camposArray))
			if len(camposArray) > 0 {
				if primerCampo, ok := camposArray[0].(map[string]interface{}); ok {
					if nombre, existe := primerCampo["nombre"]; existe {
						campoClave = fmt.Sprintf("%v", nombre)
						fmt.Printf("🔑 [resolver.go] Campo clave detectado: %s\n", campoClave)
					}
				}
			}
		}
		
		if campoClave == "" {
			campoClave = "id" // Fallback
			fmt.Printf("🔄 [resolver.go] Usando campo clave por defecto: %s\n", campoClave)
		}

		fmt.Printf("🔍 [resolver.go] Buscando en array - Campo clave: '%s', Buscando: '%s'\n", campoClave, clave)
		
		for i, registro := range datosArray {
			fmt.Printf("📄 [resolver.go] Revisando registro %d: %+v\n", i, registro)
			if fila, ok := registro.(map[string]interface{}); ok {
				if val, ok := fila[campoClave]; ok {
					valorStr := fmt.Sprintf("%v", val)
					fmt.Printf("🔑 [resolver.go] Campo clave '%s' = '%s', comparando con '%s'\n", campoClave, valorStr, clave)
					if valorStr == clave {
						fmt.Printf("✅ [resolver.go] ¡Coincidencia! Buscando campo '%s'\n", campo)
						if resultado, existe := fila[campo]; existe {
							fmt.Printf("🎯 [resolver.go] ¡Campo encontrado! Valor: %v\n", resultado)
							return resultado, nil
						} else {
							fmt.Printf("❌ [resolver.go] Campo '%s' no existe en este registro\n", campo)
						}
					}
				} else {
					fmt.Printf("⚠️ [resolver.go] Campo clave '%s' no encontrado en registro\n", campoClave)
				}
			}
		}
	}

	return nil, fmt.Errorf("no se encontró valor para clave '%s' y campo '%s' en tabla '%s'", clave, campo, nombreTabla)
}

// ResolverClaveDeContexto resuelve una clave que puede ser una referencia al contexto
func (r *FunctionResolver) ResolverClaveDeContexto(claveOriginal string) string {
	if strings.Contains(claveOriginal, ".") {
		if val, exists := r.context[claveOriginal]; exists {
			return fmt.Sprintf("%v", val)
		}
		parts := strings.Split(claveOriginal, ".")
		if len(parts) > 1 {
			campoSolo := parts[len(parts)-1]
			if val, exists := r.context[campoSolo]; exists {
				return fmt.Sprintf("%v", val)
			}
		}
	}
	return claveOriginal
}

// ResolverTablaConClaveVariable resuelve Tabla() donde la clave puede venir del contexto
func (r *FunctionResolver) ResolverTablaConClaveVariable(nombreTabla, claveOriginal, campo string) (interface{}, error) {
	claveResuelta := r.ResolverClaveDeContexto(claveOriginal)
	return r.ResolverTabla(nombreTabla, claveResuelta, campo)
}
