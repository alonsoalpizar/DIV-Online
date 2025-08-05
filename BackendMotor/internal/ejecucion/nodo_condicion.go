package ejecucion

import (
	"backendmotor/internal/estructuras"
	"backendmotor/internal/utils"
	"encoding/json"
	"fmt"
	"time"
)

func ejecutarNodoCondicion(
	n estructuras.NodoGenerico,
	resultado map[string]interface{},
	codigoCanal string,
) (bool, error) {
	inicio := time.Now()
	label := fmt.Sprintf("%v", n.Data["label"])

	// 🧠 Paso 1: Obtener la condición a evaluar
	condicionRaw, ok := n.Data["condicion"]
	if !ok {
		return false, fmt.Errorf("el nodo de condición no tiene la propiedad 'condicion'")
	}
	condicionStr, ok := condicionRaw.(string)
	if !ok {
		return false, fmt.Errorf("la propiedad 'condicion' no es un string válido")
	}

	// 🧠 Paso 2: Construir contexto desde resultado actual
	ctx := map[string]interface{}{}
	for k, v := range resultado {
		ctx[k] = v
	}
	ctx["__fecha"] = time.Now()
	ctx["__usuario"] = "demoUser"
	ctx["__rol"] = "admin"
	ctx["__nombreProceso"] = n.Data["label"]
	ctx["__idFlujo"] = n.ID

	// 🧠 Paso 3: Normalizar tipos según definición de entrada
	if entradaRaw, ok := n.Data["parametrosEntrada"]; ok {
		if entradaBytes, err := json.Marshal(entradaRaw); err == nil {
			var campos []utils.Campo
			if err := json.Unmarshal(entradaBytes, &campos); err == nil {
				ctx = utils.NormalizarContextoSegunTipos(campos, ctx)
			}
		}
	}

	// ✅ Paso 4: Evaluar la condición lógica
	cumple, err := utils.EvaluarExpresion(condicionStr, ctx)
	if err != nil {
		// 🔥 Error de evaluación (sintaxis o ejecución)
		resultado["codigoError"] = "99"
		resultado["mensajeError"] = "Error al evaluar condición"
		resultado["detalleError"] = err.Error()

		utils.RegistrarEjecucionLog(utils.RegistroEjecucion{
			Timestamp:     time.Now().Format(time.RFC3339),
			ProcesoId:     fmt.Sprintf("%v", ctx["__idFlujo"]),
			NombreProceso: label,
			Canal:         codigoCanal,
			TipoObjeto:    "condicion",
			NombreObjeto:  condicionStr,
			Parametros:    ctx,
			Resultado:     map[string]interface{}{"error": err.Error()},
			FullOutput:    nil,
			Asignaciones:  nil,
			DuracionMs:    time.Since(inicio).Milliseconds(),
			Estado:        "error",
		})
		return false, nil
	}

	// ✅ Paso 5: Llenar resultado lógico
	resultado["cumple"] = cumple
	resultado["resultado"] = cumple
	resultado["resultado_"+n.ID] = cumple

	// 🧪 Paso 6: Construir fullOutput estándar
	fullOutput := map[string]interface{}{
		"cumple": cumple,
	}
	resultado["fullOutput"] = fullOutput
	resultado["fullOutput_"+n.ID] = fullOutput

	// ✅ Paso 7: Mapear parámetros según el resultado
	if cumple {
		// Si se cumple la condición: llenar campos de salida
		if salidaRaw, ok := n.Data["parametrosSalida"]; ok {
			if salidaBytes, err := json.Marshal(salidaRaw); err == nil {
				var campos []utils.Campo
				if err := json.Unmarshal(salidaBytes, &campos); err == nil {
					for _, campo := range campos {
						if val, ok := fullOutput[campo.Nombre]; ok {
							resultado[campo.Nombre] = val
						}
					}
				}
			}
		}
	} else {
		// Si NO se cumple la condición: llenar campos de error
		resultado["codigoError"] = "66"
		resultado["mensajeError"] = "La condición no se cumple"
		resultado["detalleError"] = "cumple=false"

		if errorRaw, ok := n.Data["parametrosError"]; ok {
			if errorBytes, err := json.Marshal(errorRaw); err == nil {
				var camposError []utils.Campo
				if err := json.Unmarshal(errorBytes, &camposError); err == nil {
					for _, campo := range camposError {
						if val, ok := resultado[campo.Nombre]; ok {
							resultado[campo.Nombre] = val
						}
					}
				}
			}
		}
	}

	// 📋 Paso 8: Registro detallado de ejecución
	utils.RegistrarEjecucionLog(utils.RegistroEjecucion{
		Timestamp:     time.Now().Format(time.RFC3339),
		ProcesoId:     fmt.Sprintf("%v", ctx["__idFlujo"]),
		NombreProceso: label,
		Canal:         codigoCanal,
		TipoObjeto:    "condicion",
		NombreObjeto:  condicionStr,
		Parametros:    ctx,
		Resultado:     resultado,  // ahora incluye más datos
		FullOutput:    fullOutput, // explícito para debug
		Asignaciones: map[string]interface{}{ // indicativo, aunque no haya
			"parametrosSalida": n.Data["parametrosSalida"],
			"parametrosError":  n.Data["parametrosError"],
			"ruteo":            cumple,
		},
		DuracionMs: time.Since(inicio).Milliseconds(),
		Estado:     "exito",
	})

	return cumple, nil
}
