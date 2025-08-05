/* package estructuras

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

type Campo struct {
	Nombre     string   `json:"nombre"`
	Tipo       string   `json:"tipo"`
	Subcampos  []Campo  `json:"subcampos,omitempty"`
}

// MapearCamposDesdeFullOutput interpreta la respuesta JSON/XML y genera los campos
func MapearCamposDesdeFullOutput(fullOutput string, tipo string, tagPadre string, camposExistentes []Campo) (map[string]interface{}, error) {
	var parsed interface{}

	// ✅ Solo procesamos JSON por ahora
	if strings.ToLower(tipo) != "json" {
		return nil, fmt.Errorf("tipo de respuesta no soportado aún: %s", tipo)
	}

	if err := json.Unmarshal([]byte(fullOutput), &parsed); err != nil {
		return nil, fmt.Errorf("error parseando JSON: %w", err)
	}

	result := map[string]interface{}{}

	switch v := parsed.(type) {
	case map[string]interface{}:
		// 🔎 Si hay tagPadre, bajar un nivel
		if tagPadre != "" {
			if inner, ok := v[tagPadre]; ok {
				v = map[string]interface{}{tagPadre: inner}
			} else {
				return nil, fmt.Errorf("tagPadre '%s' no encontrado en JSON", tagPadre)
			}
		}
		for k, val := range v {
			result[k] = val
		}
	case []interface{}:
		// 📦 JSON array (lista de objetos)
		if len(v) == 0 {
			return nil, errors.New("la respuesta JSON contiene un array vacío")
		}

		// Tomamos solo el primer objeto para deducir los campos
		if obj, ok := v[0].(map[string]interface{}); ok {
			subcampos := []Campo{}
			for subKey, subVal := range obj {
				tipoCampo := detectarTipo(subVal)
				subcampos = append(subcampos, Campo{
					Nombre: subKey,
					Tipo:   tipoCampo,
				})
			}

			// El campo principal se llama "0" como convención
			result["0"] = map[string]interface{}{
				"subcampos": subcampos,
			}
		} else {
			return nil, errors.New("elemento del array no es un objeto JSON")
		}
	default:
		return nil, fmt.Errorf("estructura JSON no soportada: %T", v)
	}

	return result, nil
}

func detectarTipo(v interface{}) string {
	switch v.(type) {
	case float64:
		return "float"
	case int:
		return "int"
	case string:
		return "string"
	case bool:
		return "bool"
	case map[string]interface{}:
		return "object"
	case []interface{}:
		return "array"
	default:
		return "string"
	}
}
*/

package estructuras

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

type Campo struct {
	Nombre    string  `json:"nombre"`
	Tipo      string  `json:"tipo"`
	Subcampos []Campo `json:"subcampos,omitempty"`
}

// MapearCamposDesdeFullOutput interpreta la respuesta JSON/XML y genera los campos
func MapearCamposDesdeFullOutput(fullOutput string, tipo string, tagPadre string, camposExistentes []Campo) ([]Campo, error) {
	var parsed interface{}

	if strings.ToLower(tipo) != "json" {
		return nil, fmt.Errorf("tipo de respuesta no soportado aún: %s", tipo)
	}

	if err := json.Unmarshal([]byte(fullOutput), &parsed); err != nil {
		return nil, fmt.Errorf("error parseando JSON: %w", err)
	}

	switch v := parsed.(type) {
	case map[string]interface{}:
		if tagPadre != "" {
			if inner, ok := v[tagPadre]; ok {
				v = map[string]interface{}{tagPadre: inner}
			} else {
				return nil, fmt.Errorf("tagPadre '%s' no encontrado en JSON", tagPadre)
			}
		}

		campos := []Campo{}
		for k, val := range v {
			tipoCampo := detectarTipo(val)
			campos = append(campos, Campo{
				Nombre: k,
				Tipo:   tipoCampo,
			})
		}
		return campos, nil

	case []interface{}:
		if len(v) == 0 {
			return nil, errors.New("la respuesta JSON contiene un array vacío")
		}

		// Tomamos el primer objeto del array
		if obj, ok := v[0].(map[string]interface{}); ok {
			subcampos := []Campo{}
			for subKey, subVal := range obj {
				tipoCampo := detectarTipo(subVal)
				subcampos = append(subcampos, Campo{
					Nombre: subKey,
					Tipo:   tipoCampo,
				})
			}

			campos := []Campo{
				{
					Nombre:    "campoMultiple", // o "0" si prefieres
					Tipo:      "array",
					Subcampos: subcampos,
				},
			}
			return campos, nil
		}

		return nil, errors.New("elemento del array no es un objeto JSON")

	default:
		return nil, fmt.Errorf("estructura JSON no soportada: %T", v)
	}
}

func detectarTipo(v interface{}) string {
	switch v.(type) {
	case float64:
		return "float"
	case int:
		return "int"
	case string:
		return "string"
	case bool:
		return "bool"
	case map[string]interface{}:
		return "object"
	case []interface{}:
		return "array"
	default:
		return "string"
	}
}
func ParsearFullOutputComoCampos(fullOutput string, tipo string, tagPadre string) ([]Campo, error) {
	return MapearCamposDesdeFullOutput(fullOutput, tipo, tagPadre, nil)
}

func ExtraerValoresDesdeFullOutput(fullOutput string, tipo string, tagPadre string, camposEsperados []Campo) (map[string]interface{}, error) {
	var parsed interface{}
	if strings.ToLower(tipo) != "json" {
		return nil, fmt.Errorf("tipo de respuesta no soportado aún: %s", tipo)
	}

	if err := json.Unmarshal([]byte(fullOutput), &parsed); err != nil {
		return nil, fmt.Errorf("error parseando JSON: %w", err)
	}

	extraidos := make(map[string]interface{})

	if tagPadre != "" {
		if m, ok := parsed.(map[string]interface{}); ok {
			if inner, ok := m[tagPadre]; ok {
				parsed = inner
			}
		}
	}

	switch parsedTyped := parsed.(type) {
	case map[string]interface{}:
		for _, campo := range camposEsperados {
			if val, ok := parsedTyped[campo.Nombre]; ok {
				extraidos[campo.Nombre] = val
			}
		}
	case []interface{}:
		// si el campo esperado es tipo array, devolvemos el array entero
		for _, campo := range camposEsperados {
			if campo.Tipo == "array" {
				extraidos[campo.Nombre] = parsedTyped
			}
		}
	}

	return extraidos, nil
}
