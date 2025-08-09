package ejecucion

import (
	"backendmotor/internal/estructuras"
	"backendmotor/internal/utils"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"
	"unicode"
)

// ejecutarNodoSplitter maneja tanto el modo descomponer como el modo unir del nodo Splitter
func ejecutarNodoSplitter(
	n estructuras.NodoGenerico,
	resultado map[string]interface{},
	canalCodigo string,
) (map[string]interface{}, map[string]interface{}, error) {
	inicio := time.Now()
	nodoID := n.ID

	// Registrar inicio de ejecución
	utils.RegistrarEjecucionLog(utils.RegistroEjecucion{
		Timestamp:     time.Now().Format(time.RFC3339),
		NombreProceso: "Splitter",
		Canal:         canalCodigo,
		TipoObjeto:    "splitter",
		NombreObjeto:  nodoID,
		Estado:        "iniciando",
	})

	// Obtener modo de operación
	modoOperacion, ok := n.Data["modoOperacion"].(string)
	if !ok {
		modoOperacion = "descomponer" // valor por defecto
	}

	fmt.Printf("🔄 Ejecutando nodo Splitter: %s en modo %s\n", nodoID, modoOperacion)

	var newResultado map[string]interface{}
	var asignaciones map[string]interface{}
	var err error

	if modoOperacion == "descomponer" {
		fmt.Printf("🛠️ Iniciando modo descomponer para nodo %s\n", nodoID)
		newResultado, asignaciones, err = ejecutarModoDescomponer(n, resultado, canalCodigo)
		if err != nil {
			fmt.Printf("❌ Error en modo descomponer: %v\n", err)
		} else {
			fmt.Printf("✅ Modo descomponer completado para nodo %s\n", nodoID)
		}
	} else if modoOperacion == "unir" {
		fmt.Printf("🛠️ Iniciando modo unir para nodo %s\n", nodoID)
		newResultado, asignaciones, err = ejecutarModoUnir(n, resultado, canalCodigo)
		if err != nil {
			fmt.Printf("❌ Error en modo unir: %v\n", err)
		} else {
			fmt.Printf("✅ Modo unir completado para nodo %s\n", nodoID)
		}
	} else {
		err = fmt.Errorf("modo de operación no válido: %s", modoOperacion)
		fmt.Printf("❌ Modo de operación no válido: %s\n", modoOperacion)
	}

	// Registrar finalización
	duracion := time.Since(inicio).Milliseconds()
	estado := "completado"
	if err != nil {
		estado = "error"
	}

	fmt.Printf("🔧 [DEBUG] Splitter %s finalizado - newResultado: %v\n", nodoID, getKeys(newResultado))
	fmt.Printf("🔧 [DEBUG] Splitter %s finalizado - asignaciones: %v\n", nodoID, getKeys(asignaciones))

	utils.RegistrarEjecucionLog(utils.RegistroEjecucion{
		Timestamp:     time.Now().Format(time.RFC3339),
		NombreProceso: "Splitter",
		Canal:         canalCodigo,
		TipoObjeto:    "splitter",
		NombreObjeto:  nodoID,
		Resultado:     newResultado,
		Estado:        estado,
		DuracionMs:    duracion,
	})

	return newResultado, asignaciones, err
}

// ejecutarModoDescomponer descompone una trama según la configuración del nodo
func ejecutarModoDescomponer(
	n estructuras.NodoGenerico,
	resultado map[string]interface{},
	canalCodigo string,
) (map[string]interface{}, map[string]interface{}, error) {
	
	fmt.Printf("🔧 [DEBUG] Iniciando ejecutarModoDescomponer\n")
	fmt.Printf("🔧 [DEBUG] Claves disponibles en Data: %v\n", getKeys(n.Data))
	
	// Obtener configuración de descomposición - intentar varios nombres posibles
	tipoAnalisis, _ := n.Data["tipoAnalisis"].(string)
	if tipoAnalisis == "" {
		// Intentar con "modoParseo"
		tipoAnalisis, _ = n.Data["modoParseo"].(string)
		if tipoAnalisis == "" {
			tipoAnalisis = "delimitado" // valor por defecto
			fmt.Printf("⚠️ [DEBUG] Tipo de análisis no encontrado, usando valor por defecto: %s\n", tipoAnalisis)
		}
	}
	fmt.Printf("🔧 [DEBUG] Tipo de análisis: %s\n", tipoAnalisis)

	// Obtener campo de entrada
	campoEntrada, ok := n.Data["campoEntrada"].(string)
	if !ok || campoEntrada == "" {
		fmt.Printf("❌ [DEBUG] Campo de entrada no definido o vacío\n")
		return resultado, nil, fmt.Errorf("campo de entrada no definido")
	}
	fmt.Printf("🔧 [DEBUG] Campo de entrada configurado: %s\n", campoEntrada)

	// Obtener datos de entrada
	datosEntrada, exists := resultado[campoEntrada]
	if !exists {
		fmt.Printf("❌ [DEBUG] Campo %s no encontrado. Campos disponibles: %v\n", campoEntrada, getKeys(resultado))
		
		// Intento de fallback inteligente con múltiples opciones
		if campoEntrada == "CampoIN" {
			// Lista de campos alternativos en orden de prioridad
			alternativas := []string{"Fila", "StringFijo", "Data", "Contenido", "Valor"}
			
			for _, alternativa := range alternativas {
				if altData, altExists := resultado[alternativa]; altExists {
					fmt.Printf("⚠️ [DEBUG] Usando campo '%s' como fallback para 'CampoIN'\n", alternativa)
					datosEntrada = altData
					exists = true
					break
				}
			}
		}
		
		if !exists {
			return resultado, nil, fmt.Errorf("campo %s no encontrado en resultado", campoEntrada)
		}
	}
	fmt.Printf("🔧 [DEBUG] Datos encontrados para campo %s\n", campoEntrada)

	tramaTexto, ok := datosEntrada.(string)
	if !ok {
		fmt.Printf("❌ [DEBUG] Campo %s no es string, es tipo %T con valor: %v\n", campoEntrada, datosEntrada, datosEntrada)
		return resultado, nil, fmt.Errorf("campo %s no es una cadena de texto", campoEntrada)
	}

	fmt.Printf("🔍 Descomponiendo trama de %d caracteres usando modo %s: \"%s\"\n", len(tramaTexto), tipoAnalisis, tramaTexto)

	var newResultado map[string]interface{}
	var asignaciones map[string]interface{}
	var err error

	switch tipoAnalisis {
	case "delimitado":
		newResultado, asignaciones, err = analizarModoDelimitado(n, tramaTexto, resultado)
	case "posicionFija", "plano":  // Soportar ambos nombres
		newResultado, asignaciones, err = analizarModoPosicionFija(n, tramaTexto, resultado)
	case "bloquesRepetidos", "bloques_repetidos":  // Soportar ambos nombres
		newResultado, asignaciones, err = analizarModoBloques(n, tramaTexto, resultado)
	case "plantilla":  // Agregar soporte para plantilla TCP
		newResultado, asignaciones, err = analizarModoDelimitado(n, tramaTexto, resultado)  // Por ahora usar delimitado
	default:
		err = fmt.Errorf("tipo de análisis no soportado: %s", tipoAnalisis)
		newResultado = resultado
	}

	return newResultado, asignaciones, err
}

// analizarModoPosicionFija procesa tramas con campos en posiciones fijas
func analizarModoPosicionFija(
	n estructuras.NodoGenerico,
	trama string,
	resultado map[string]interface{},
) (map[string]interface{}, map[string]interface{}, error) {
	
	fmt.Printf("🔧 [DEBUG] Iniciando analizarModoPosicionFija\n")
	fmt.Printf("🔧 [DEBUG] Configuración del nodo para posición fija: %+v\n", n.Data)
	
	// Intentar obtener campos de salida con varios nombres posibles
	var camposSalida []interface{}
	var ok bool
	
	// Intentar con diferentes estructuras
	if segmentosFijos, exists := n.Data["segmentosFijos"].([]interface{}); exists && len(segmentosFijos) > 0 {
		fmt.Printf("🔧 [DEBUG] Usando configuración segmentosFijos\n")
		camposSalida = segmentosFijos
		ok = true
	} else {
		// Fallback a configuración directa
		camposSalida, ok = n.Data["camposSalida"].([]interface{})
		if !ok {
			camposSalida, ok = n.Data["parametrosSalida"].([]interface{})
		}
	}
	
	if !ok || len(camposSalida) == 0 {
		fmt.Printf("❌ [DEBUG] No se encontraron campos de salida para posición fija\n")
		return resultado, nil, fmt.Errorf("campos de salida no definidos")
	}
	
	fmt.Printf("🔧 [DEBUG] Campos de salida encontrados: %d campos\n", len(camposSalida))

	// Crear resultado manteniendo campos originales
	newResultado := make(map[string]interface{})
	for k, v := range resultado {
		newResultado[k] = v
	}
	
	asignaciones := make(map[string]interface{})
	tramaRunes := []rune(trama)
	posicionActual := 0

	// Extraer cada campo según su configuración EN EL ORDEN DEFINIDO
	for i, campoInterface := range camposSalida {
		campo, ok := campoInterface.(map[string]interface{})
		if !ok {
			fmt.Printf("⚠️ [DEBUG] Campo %d no es un mapa válido\n", i)
			continue
		}

		nombre, ok := campo["nombre"].(string)
		if !ok {
			fmt.Printf("⚠️ [DEBUG] Campo %d no tiene nombre válido\n", i)
			continue
		}
		fmt.Printf("🔧 [DEBUG] Campo encontrado en configuración: '%s'\n", nombre)

		longitud, ok := campo["longitud"].(float64)
		if !ok {
			fmt.Printf("⚠️ [DEBUG] Campo %s no tiene longitud válida\n", nombre)
			continue
		}

		// Para segmentosFijos, usar posición secuencial; para camposSalida usar posición específica
		var inicioInt int
		if inicio, hasInicio := campo["inicio"].(float64); hasInicio {
			inicioInt = int(inicio)
		} else {
			inicioInt = posicionActual
		}

		longitudInt := int(longitud)
		repeticiones := 1
		if rep, hasRep := campo["repeticiones"].(float64); hasRep {
			repeticiones = int(rep)
		}

		fmt.Printf("🔧 [DEBUG] Procesando campo %s: inicio=%d, longitud=%d, repeticiones=%d\n", 
			nombre, inicioInt, longitudInt, repeticiones)

		// Determinar el tipo de estructura
		tipoEstructura, _ := campo["tipo_estructura"].(string)
		if tipoEstructura == "" && repeticiones > 1 {
			tipoEstructura = "object" // valor por defecto
		}
		
		fmt.Printf("🔧 [DEBUG] Campo %s: repeticiones=%d, tipo_estructura='%s'\n", nombre, repeticiones, tipoEstructura)

		// Procesar repeticiones
		if repeticiones > 1 && tipoEstructura == "array" {
			fmt.Printf("🔧 [DEBUG] ✅ Entrando en modo ARRAY para campo %s\n", nombre)
			// Crear un array para múltiples repeticiones
			var arrayElementos []string
			
			for r := 0; r < repeticiones; r++ {
				// Validar límites
				if inicioInt < 0 || inicioInt >= len(tramaRunes) {
					fmt.Printf("⚠️ [DEBUG] Campo %s[%d] fuera de límites: inicio=%d, longitud_trama=%d\n", 
						nombre, r, inicioInt, len(tramaRunes))
					break
				}

				fin := inicioInt + longitudInt
				if fin > len(tramaRunes) {
					fin = len(tramaRunes)
					fmt.Printf("⚠️ [DEBUG] Campo %s[%d] truncado: fin=%d -> %d\n", nombre, r, inicioInt+longitudInt, fin)
				}

				valor := string(tramaRunes[inicioInt:fin])
				valor = strings.TrimSpace(valor) // Limpiar espacios en blanco
				
				// Aplicar transformaciones
				if encoding, ok := campo["encoding"].(string); ok {
					valor = aplicarDecodificacion(valor, encoding)
				}

				arrayElementos = append(arrayElementos, valor)
				fmt.Printf("🔧 [DEBUG] Elemento de array extraído: %s[%d] = '%s'\n", nombre, r, valor)

				inicioInt += longitudInt
			}
			
			// Asignar el array completo usando el nombre dinámico del campo
			newResultado[nombre] = arrayElementos
			asignaciones[nombre] = arrayElementos
			fmt.Printf("🔧 [DEBUG] Array dinámico creado: %s con %d elementos\n", nombre, len(arrayElementos))
			
		} else {
			// Procesamiento normal para campos simples o múltiples como objeto
			fmt.Printf("🔧 [DEBUG] ❌ NO entrando en modo array para campo %s (repeticiones=%d, tipo='%s')\n", nombre, repeticiones, tipoEstructura)
			for r := 0; r < repeticiones; r++ {
				nombreCampo := nombre
				if repeticiones > 1 {
					nombreCampo = fmt.Sprintf("%s%d", nombre, r+1)
				}

				// Validar límites
				if inicioInt < 0 || inicioInt >= len(tramaRunes) {
					fmt.Printf("⚠️ [DEBUG] Campo %s fuera de límites: inicio=%d, longitud_trama=%d\n", 
						nombreCampo, inicioInt, len(tramaRunes))
					break
				}

				fin := inicioInt + longitudInt
				if fin > len(tramaRunes) {
					fin = len(tramaRunes)
					fmt.Printf("⚠️ [DEBUG] Campo %s truncado: fin=%d -> %d\n", nombreCampo, inicioInt+longitudInt, fin)
				}

				valor := string(tramaRunes[inicioInt:fin])
				
				// Aplicar transformaciones
				if encoding, ok := campo["encoding"].(string); ok {
					valor = aplicarDecodificacion(valor, encoding)
				}

				newResultado[nombreCampo] = valor
				asignaciones[nombreCampo] = valor
				
				fmt.Printf("🔧 [DEBUG] Campo extraído: %s = '%s'\n", nombreCampo, valor)

				inicioInt += longitudInt
			}
		}
		
		posicionActual = inicioInt
	}

	fmt.Printf("✅ Modo posición fija procesado: %d campos extraídos\n", len(asignaciones))
	fmt.Printf("🔧 [DEBUG] Campos en resultado: %v\n", getKeys(newResultado))
	return newResultado, asignaciones, nil
}

// Placeholder para otras funciones que se referencian
func analizarModoDelimitado(n estructuras.NodoGenerico, trama string, resultado map[string]interface{}) (map[string]interface{}, map[string]interface{}, error) {
	return resultado, make(map[string]interface{}), fmt.Errorf("modo delimitado no implementado")
}

// analizarModoBloques procesa tramas con bloques repetidos (máximo 20 iteraciones)
func analizarModoBloques(
	n estructuras.NodoGenerico,
	trama string,
	resultado map[string]interface{},
) (map[string]interface{}, map[string]interface{}, error) {
	
	fmt.Printf("🔧 [DEBUG] Iniciando analizarModoBloques\n")
	fmt.Printf("🔧 [DEBUG] Configuración del nodo para bloques: %+v\n", n.Data)
	
	const maxIteraciones = 20

	// Intentar obtener longitud del bloque con varios nombres posibles
	longitudBloque, ok := n.Data["longitudBloque"].(float64)
	if !ok {
		longitudBloque, ok = n.Data["longitudRegistro"].(float64)
		if !ok {
			fmt.Printf("❌ [DEBUG] longitudBloque/longitudRegistro no encontrada\n")
			return resultado, nil, fmt.Errorf("longitud del bloque no definida")
		}
	}
	fmt.Printf("🔧 [DEBUG] Longitud del bloque: %.0f\n", longitudBloque)

	// Intentar obtener configuración de subcampos
	var camposSalida []interface{}
	
	// Intentar con diferentes estructuras de configuración
	if campoMultiple, exists := n.Data["campoMultiple"].(map[string]interface{}); exists {
		fmt.Printf("🔧 [DEBUG] Usando configuración campoMultiple\n")
		if subcampos, ok := campoMultiple["subcampos"].([]interface{}); ok {
			camposSalida = subcampos
			fmt.Printf("🔧 [DEBUG] Subcampos encontrados: %d\n", len(subcampos))
		}
	}
	
	if len(camposSalida) == 0 {
		// Fallback a configuración directa
		camposSalida, ok = n.Data["camposSalida"].([]interface{})
		if !ok {
			camposSalida, ok = n.Data["parametrosSalida"].([]interface{})
			if !ok {
				fmt.Printf("❌ [DEBUG] No se encontraron campos/subcampos de salida\n")
				return resultado, nil, fmt.Errorf("campos de salida no definidos")
			}
		}
	}
	fmt.Printf("🔧 [DEBUG] Campos de salida: %d campos\n", len(camposSalida))

	// Obtener nombre del array contenedor
	nombreArray := "items"
	if campoMultiple, exists := n.Data["campoMultiple"].(map[string]interface{}); exists {
		if nombre, ok := campoMultiple["nombreArray"].(string); ok && nombre != "" {
			nombreArray = nombre
		}
	}
	fmt.Printf("🔧 [DEBUG] Nombre del array: %s\n", nombreArray)

	longitudBloqueInt := int(longitudBloque)
	tramaRunes := []rune(trama)
	
	newResultado := make(map[string]interface{})
	for k, v := range resultado {
		newResultado[k] = v
	}

	var items []map[string]interface{}
	posicion := 0

	// Procesar bloques (máximo 20 iteraciones)
	for i := 0; i < maxIteraciones && posicion < len(tramaRunes); i++ {
		finBloque := posicion + longitudBloqueInt
		if finBloque > len(tramaRunes) {
			finBloque = len(tramaRunes)
		}

		bloque := string(tramaRunes[posicion:finBloque])
		
		// Verificar si el bloque contiene datos válidos
		if strings.TrimSpace(bloque) == "" {
			fmt.Printf("🛑 Bloque %d vacío, deteniendo iteración\n", i+1)
			break
		}

		// Extraer campos del bloque
		item := make(map[string]interface{})
		bloqueRunes := []rune(bloque)

		for _, campoInterface := range camposSalida {
			campo, ok := campoInterface.(map[string]interface{})
			if !ok {
				continue
			}

			nombre, ok := campo["nombre"].(string)
			if !ok {
				continue
			}

			inicio, ok := campo["inicio"].(float64)
			if !ok {
				continue
			}

			longitud, ok := campo["longitud"].(float64)
			if !ok {
				continue
			}

			inicioInt := int(inicio)
			longitudInt := int(longitud)

			// Validar límites dentro del bloque
			if inicioInt < 0 || inicioInt >= len(bloqueRunes) {
				continue
			}

			fin := inicioInt + longitudInt
			if fin > len(bloqueRunes) {
				fin = len(bloqueRunes)
			}

			valor := string(bloqueRunes[inicioInt:fin])
			valor = strings.TrimSpace(valor)

			// Aplicar transformaciones
			if encoding, ok := campo["encoding"].(string); ok {
				valor = aplicarDecodificacion(valor, encoding)
			}

			item[nombre] = valor
		}

		// Solo agregar el item si contiene datos válidos
		tienesDatos := false
		for _, v := range item {
			if str, ok := v.(string); ok && strings.TrimSpace(str) != "" {
				tienesDatos = true
				break
			}
		}

		if tienesDatos {
			items = append(items, item)
			fmt.Printf("📦 Bloque %d procesado: %d campos extraídos\n", i+1, len(item))
		} else {
			fmt.Printf("🛑 Bloque %d sin datos válidos, deteniendo iteración\n", i+1)
			break
		}

		posicion = finBloque
	}

	// Obtener el nombre del objeto padre (contenedor principal)
	nombreObjeto := "Items"  // Nombre genérico por defecto
	if campoMultiple, exists := n.Data["campoMultiple"].(map[string]interface{}); exists {
		if nombre, ok := campoMultiple["nombreObjeto"].(string); ok && nombre != "" {
			nombreObjeto = nombre
		}
	}

	// Crear estructura XML-like correcta: <Recibos><Recibo>[]</Recibo></Recibos>
	// nombreObjeto (Recibos) contiene nombreArray (Recibo) que es el array
	objetoResultado := map[string]interface{}{
		nombreArray: items,  // "Recibo": [array de objetos]
	}
	
	newResultado[nombreObjeto] = objetoResultado  // "Recibos": {"Recibo": [...]}

	asignaciones := map[string]interface{}{
		nombreObjeto: objetoResultado,
	}

	fmt.Printf("✅ Modo bloques procesado: %d items extraídos (máx %d iteraciones)\n", len(items), maxIteraciones)
	fmt.Printf("🔧 [DEBUG] Estructura XML-like creada: <%s>[%d elementos]</%s>\n", nombreObjeto, len(items), nombreObjeto)
	fmt.Printf("🔧 [DEBUG] Campos en newResultado: %v\n", getKeys(newResultado))
	fmt.Printf("🔧 [DEBUG] Campos en asignaciones: %v\n", getKeys(asignaciones))
	
	return newResultado, asignaciones, nil
}

// ejecutarModoUnir une campos según la configuración del nodo
func ejecutarModoUnir(n estructuras.NodoGenerico, resultado map[string]interface{}, canalCodigo string) (map[string]interface{}, map[string]interface{}, error) {
	
	fmt.Printf("🔧 [DEBUG] Iniciando ejecutarModoUnir\n")
	fmt.Printf("🔧 [DEBUG] Claves disponibles en Data: %v\n", getKeys(n.Data))
	fmt.Printf("🔧 [DEBUG] Datos de entrada disponibles: %v\n", getKeys(resultado))
	
	// DEBUG: Mostrar el contenido completo de los datos de entrada
	for k, v := range resultado {
		fmt.Printf("🔧 [DEBUG] Campo entrada: %s = %v (tipo: %T)\n", k, v, v)
	}

	// 📋 Procesar asignaciones de parámetros de entrada (CLAVE para modo unir)
	parametrosResueltos, errAsign := procesarAsignacionesParametrosSplitter(n, resultado)
	if errAsign != nil {
		fmt.Printf("❌ [DEBUG] Error procesando asignaciones: %v\n", errAsign)
		return resultado, nil, fmt.Errorf("error procesando asignaciones de parámetros: %w", errAsign)
	}
	
	// Actualizar resultado con parámetros resueltos
	for k, v := range parametrosResueltos {
		resultado[k] = v
		fmt.Printf("🔧 [DEBUG] Parámetro resuelto: %s = %v\n", k, v)
	}

	// Obtener configuración del modo de unión
	modoParseo, ok := n.Data["modoParseo"].(string)
	if !ok || modoParseo == "" {
		// Intentar con nombres alternativos
		modoParseo, _ = n.Data["tipoAnalisis"].(string)
		if modoParseo == "" {
			modoParseo = "plano" // valor por defecto
		}
	}
	fmt.Printf("🔧 [DEBUG] Modo de parseo encontrado: '%s'\n", modoParseo)

	// Obtener campo de salida
	campoSalida, ok := n.Data["campoSalida"].(string)
	if !ok || campoSalida == "" {
		campoSalida = "StringUnido" // valor por defecto
	}
	fmt.Printf("🔧 [DEBUG] Campo de salida configurado: '%s'\n", campoSalida)

	// Crear resultado manteniendo campos originales
	newResultado := make(map[string]interface{})
	for k, v := range resultado {
		newResultado[k] = v
	}
	
	asignaciones := make(map[string]interface{})
	
	var stringUnido string
	var err error

	switch modoParseo {
	case "plano", "posicionFija":
		stringUnido, err = unirModoPlano(n, resultado)
	case "delimitado":
		stringUnido, err = unirModoDelimitado(n, resultado)
	default:
		err = fmt.Errorf("modo de parseo no soportado para unir: %s", modoParseo)
	}

	if err != nil {
		fmt.Printf("❌ [DEBUG] Error en modo unir: %v\n", err)
		return resultado, nil, err
	}

	// Asignar el resultado
	newResultado[campoSalida] = stringUnido
	asignaciones[campoSalida] = stringUnido

	fmt.Printf("✅ Modo unir completado: campo '%s' = '%s'\n", campoSalida, stringUnido)
	fmt.Printf("🔧 [DEBUG] Campos en resultado: %v\n", getKeys(newResultado))
	
	return newResultado, asignaciones, nil
}

// unirModoPlano une campos usando posiciones fijas
func unirModoPlano(n estructuras.NodoGenerico, resultado map[string]interface{}) (string, error) {
	fmt.Printf("🔧 [DEBUG] Iniciando unirModoPlano\n")
	
	// Obtener configuración de segmentos fijos
	segmentosFijos, ok := n.Data["segmentosFijos"].([]interface{})
	if !ok || len(segmentosFijos) == 0 {
		fmt.Printf("❌ [DEBUG] segmentosFijos no definidos\n")
		return "", fmt.Errorf("segmentosFijos no definidos para modo plano")
	}
	
	fmt.Printf("🔧 [DEBUG] Segmentos fijos encontrados: %d\n", len(segmentosFijos))
	
	var stringUnido strings.Builder
	
	// Procesar cada segmento en orden
	for i, segmentoInterface := range segmentosFijos {
		segmento, ok := segmentoInterface.(map[string]interface{})
		if !ok {
			fmt.Printf("⚠️ [DEBUG] Segmento %d no es válido\n", i)
			continue
		}
		
		nombre, ok := segmento["nombre"].(string)
		if !ok {
			fmt.Printf("⚠️ [DEBUG] Segmento %d sin nombre\n", i)
			continue
		}
		
		longitud, ok := segmento["longitud"].(float64)
		if !ok {
			fmt.Printf("⚠️ [DEBUG] Segmento %s sin longitud\n", nombre)
			continue
		}
		
		longitudInt := int(longitud)
		
		// Obtener tipo de relleno
		relleno, _ := segmento["relleno"].(string)
		if relleno == "" {
			relleno = "espacios" // valor por defecto
		}
		
		fmt.Printf("🔧 [DEBUG] Procesando segmento: %s, longitud=%d, relleno=%s\n", nombre, longitudInt, relleno)
		
		// Debug: Validar tipo de relleno
		if !esRellenoValido(relleno) {
			fmt.Printf("⚠️ [DEBUG] ADVERTENCIA: Tipo de relleno '%s' puede no ser reconocido. Tipos válidos: ceros, ceros_izquierda, ceros_derecha, espacios, espacios_derecha, espacios_izq, espacios_izquierda\n", relleno)
		}
		
		// Obtener valor del campo
		valor, exists := resultado[nombre]
		if !exists {
			fmt.Printf("⚠️ [DEBUG] Campo %s no encontrado en resultado, usando valor vacío\n", nombre)
			valor = ""
		}
		
		// Convertir a string
		valorStr := fmt.Sprintf("%v", valor)
		
		// Aplicar longitud y relleno
		fmt.Printf("🔧 [DEBUG] ANTES del formateo: valor='%s', longitud=%d, tipoRelleno='%s'\n", valorStr, longitudInt, relleno)
		valorFormateado := aplicarFormatoPosicionFija(valorStr, longitudInt, relleno)
		fmt.Printf("🔧 [DEBUG] DESPUÉS del formateo: resultado='%s'\n", valorFormateado)
		
		stringUnido.WriteString(valorFormateado)
		fmt.Printf("🔧 [DEBUG] Segmento añadido: '%s' -> '%s'\n", valorStr, valorFormateado)
	}
	
	resultadoStr := stringUnido.String()
	fmt.Printf("✅ String unido (modo plano): '%s' (longitud: %d)\n", resultadoStr, len(resultadoStr))
	
	// DEBUG: Mostrar ejemplo de todos los tipos de relleno aplicados
	if len(segmentosFijos) > 0 {
		fmt.Printf("🔧 [DEBUG] === DEMO DE TIPOS DE RELLENO ===\n")
		for _, segmentoInterface := range segmentosFijos {
			if segmento, ok := segmentoInterface.(map[string]interface{}); ok {
				if nombre, hasNombre := segmento["nombre"].(string); hasNombre && nombre != "" {
					if valor, exists := resultado[nombre]; exists {
						valorStr := fmt.Sprintf("%v", valor)
						longitudInt := 10 // longitud demo
						fmt.Printf("🔧 [DEBUG] Campo '%s' (valor='%s') con diferentes rellenos (longitud %d):\n", nombre, valorStr, longitudInt)
						fmt.Printf("  - ceros_izquierda: '%s'\n", aplicarFormatoPosicionFija(valorStr, longitudInt, "ceros_izquierda"))
						fmt.Printf("  - ceros_derecha:   '%s'\n", aplicarFormatoPosicionFija(valorStr, longitudInt, "ceros_derecha"))
						fmt.Printf("  - espacios_izq:    '%s'\n", aplicarFormatoPosicionFija(valorStr, longitudInt, "espacios_izquierda"))
						fmt.Printf("  - espacios_der:    '%s'\n", aplicarFormatoPosicionFija(valorStr, longitudInt, "espacios_derecha"))
						break // Solo mostrar demo para el primer campo
					}
				}
			}
		}
		fmt.Printf("🔧 [DEBUG] ================================\n")
	}
	
	return resultadoStr, nil
}

// unirModoDelimitado une campos usando delimitadores
func unirModoDelimitado(n estructuras.NodoGenerico, resultado map[string]interface{}) (string, error) {
	fmt.Printf("🔧 [DEBUG] Iniciando unirModoDelimitado\n")
	
	// Obtener delimitador
	delimitador, ok := n.Data["delimitadorPrincipal"].(string)
	if !ok || delimitador == "" {
		delimitador = "," // valor por defecto
	}
	
	// Obtener campos a unir
	camposUnir, ok := n.Data["camposUnir"].([]interface{})
	if !ok || len(camposUnir) == 0 {
		// Si no hay camposUnir definidos, usar todos los campos disponibles
		var valores []string
		for _, v := range resultado {
			valores = append(valores, fmt.Sprintf("%v", v))
		}
		return strings.Join(valores, delimitador), nil
	}
	
	// Unir campos específicos
	var valores []string
	for _, campoInterface := range camposUnir {
		if campo, ok := campoInterface.(string); ok {
			if valor, exists := resultado[campo]; exists {
				valores = append(valores, fmt.Sprintf("%v", valor))
			} else {
				valores = append(valores, "") // Campo vacío si no existe
			}
		}
	}
	
	resultadoStr := strings.Join(valores, delimitador)
	fmt.Printf("✅ String unido (modo delimitado): '%s'\n", resultadoStr)
	
	return resultadoStr, nil
}

// aplicarFormatoPosicionFija aplica longitud y relleno a un valor
func aplicarFormatoPosicionFija(valor string, longitud int, tipoRelleno string) string {
	valorRunes := []rune(valor)
	
	// Si el valor es más largo, truncar
	if len(valorRunes) > longitud {
		return string(valorRunes[:longitud])
	}
	
	// Si el valor es más corto, rellenar
	if len(valorRunes) < longitud {
		faltante := longitud - len(valorRunes)
		
		switch tipoRelleno {
		case "ceros", "ceros_izquierda", "izquierda": 
			// Relleno con ceros a la izquierda (formato numérico típico)
			return strings.Repeat("0", faltante) + valor
		case "ceros_derecha", "derecha":
			// Relleno con ceros a la derecha
			return valor + strings.Repeat("0", faltante)
		case "espacios", "espacios_derecha":
			// Relleno con espacios a la derecha (formato texto típico)
			return valor + strings.Repeat(" ", faltante)
		case "espacios_izq", "espacios_izquierda":
			// Relleno con espacios a la izquierda (alineación derecha)
			return strings.Repeat(" ", faltante) + valor
		default:
			// Por defecto, espacios a la derecha
			fmt.Printf("⚠️ [DEBUG] Tipo de relleno no reconocido '%s', usando espacios a la derecha\n", tipoRelleno)
			return valor + strings.Repeat(" ", faltante)
		}
	}
	
	return valor
}

// aplicarDecodificacion aplica decodificaciones según el tipo especificado
func aplicarDecodificacion(valor, encoding string) string {
	switch encoding {
	case "base64":
		if decoded, err := base64.StdEncoding.DecodeString(valor); err == nil {
			return string(decoded)
		}
	case "hex":
		if decoded, err := hex.DecodeString(valor); err == nil {
			return string(decoded)
		}
	case "ascii":
		// Filtrar solo caracteres ASCII imprimibles
		return strings.Map(func(r rune) rune {
			if r >= 32 && r <= 126 {
				return r
			}
			return -1
		}, valor)
	case "numeric":
		// Extraer solo números
		re := regexp.MustCompile(`\d+`)
		return strings.Join(re.FindAllString(valor, -1), "")
	case "alphanumeric":
		// Extraer solo caracteres alfanuméricos
		return strings.Map(func(r rune) rune {
			if unicode.IsLetter(r) || unicode.IsDigit(r) {
				return r
			}
			return -1
		}, valor)
	}
	return valor
}

// esRellenoValido verifica si el tipo de relleno es válido
func esRellenoValido(tipoRelleno string) bool {
	tiposValidos := []string{
		"ceros", "ceros_izquierda", "ceros_derecha",
		"espacios", "espacios_derecha", "espacios_izq", "espacios_izquierda",
		"izquierda", "derecha", // Alias del frontend
	}
	
	for _, tipo := range tiposValidos {
		if tipoRelleno == tipo {
			return true
		}
	}
	return false
}

// getKeys obtiene las claves de un mapa para debug
func getKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

// AsignacionSplitter representa una asignación para el splitter (similar a AsignacionProceso)
type AsignacionSplitter struct {
	Tipo    string `json:"tipo"`    // "literal", "campo", "funcion", etc.
	Valor   string `json:"valor"`   // El valor o nombre del campo
	Destino string `json:"destino"` // Campo de destino
}

// procesarAsignacionesParametrosSplitter procesa las asignaciones de parámetros para el splitter
func procesarAsignacionesParametrosSplitter(n estructuras.NodoGenerico, contexto map[string]interface{}) (map[string]interface{}, error) {
	fmt.Printf("🔧 [DEBUG] Iniciando procesarAsignacionesParametrosSplitter\n")
	
	// Extraer el bloque de asignaciones del nodo
	asignacionesJSON, _ := json.Marshal(n.Data["asignaciones"])
	fmt.Printf("🔧 [DEBUG] JSON de asignaciones: %s\n", string(asignacionesJSON))

	// Mapear asignaciones agrupadas por nodo fuente
	var asignaciones map[string][]AsignacionSplitter
	if err := json.Unmarshal(asignacionesJSON, &asignaciones); err != nil {
		fmt.Printf("❌ [DEBUG] Error parseando asignaciones: %v\n", err)
		return make(map[string]interface{}), nil // Retornar vacío si no hay asignaciones válidas
	}

	// Estructura para parámetros resueltos
	parametrosResueltos := make(map[string]interface{})

	// Recorrer todas las asignaciones
	for nodoFuente, asigns := range asignaciones {
		fmt.Printf("🔗 [DEBUG] Procesando asignaciones desde nodo: %s (%d asignaciones)\n", nodoFuente, len(asigns))
		
		for _, asign := range asigns {
			fmt.Printf("📝 [DEBUG] Procesando asignación: %s = %s (%s)\n", asign.Destino, asign.Valor, asign.Tipo)

			switch asign.Tipo {
			case "campo":
				// Copiar desde variable existente en contexto
				if val, ok := contexto[asign.Valor]; ok {
					parametrosResueltos[asign.Destino] = val
					fmt.Printf("✅ [DEBUG] Campo resuelto: %s = %v\n", asign.Destino, val)
				} else {
					fmt.Printf("⚠️ [DEBUG] Campo no encontrado en contexto: %s\n", asign.Valor)
				}

			case "literal":
				// Asignar valor directamente
				parametrosResueltos[asign.Destino] = asign.Valor
				fmt.Printf("✅ [DEBUG] Literal asignado: %s = %s\n", asign.Destino, asign.Valor)

			default:
				fmt.Printf("⚠️ [DEBUG] Tipo de asignación no soportado en splitter: %s\n", asign.Tipo)
			}
		}
	}

	fmt.Printf("🔧 [DEBUG] Parámetros resueltos totales: %d\n", len(parametrosResueltos))
	return parametrosResueltos, nil
}
