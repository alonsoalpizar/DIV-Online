package ejecutores

import (
	"bytes"
	"encoding/json"
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/beevik/etree"

	"backendmotor/internal/database"
	"backendmotor/internal/estructuras"
	"backendmotor/internal/models"
)

// SOAPEnvelope representa la estructura base de un mensaje SOAP
type SOAPEnvelope struct {
	XMLName xml.Name `xml:"soap:Envelope"`
	XMLNS   string   `xml:"xmlns:soap,attr"`
	Body    SOAPBody `xml:"soap:Body"`
}

type SOAPBody struct {
	Content interface{} `xml:",omitempty"`
}

// SOAPFault para manejo de errores SOAP
type SOAPFault struct {
	XMLName xml.Name `xml:"Fault"`
	Code    string   `xml:"faultcode"`
	String  string   `xml:"faultstring"`
	Detail  string   `xml:"detail,omitempty"`
}

// EjecutarSOAP ejecuta una operación SOAP contra un servicio externo
func EjecutarSOAP(nodo estructuras.NodoGenerico, resultado map[string]interface{}, servidor models.Servidor, procesoID string) (string, error) {
	// 🔍 Extraer configuración del nodo
	objeto, ok := nodo.Data["objeto"].(string)
	if !ok || objeto == "" {
		return "", errors.New("método SOAP no definido en el nodo")
	}

	// ✅ Extraer campos de salida si están definidos
	var camposSalida []estructuras.Campo

	if salidaRaw, ok := nodo.Data["parametrosSalida"]; ok {
		salidaBytes, err := json.Marshal(salidaRaw)
		if err != nil {
			fmt.Printf("⚠️ Error al serializar camposSalida: %v\n", err)
		} else {
			err = json.Unmarshal(salidaBytes, &camposSalida)
			if err != nil {
				fmt.Printf("⚠️ Error al deserializar camposSalida: %v\n", err)
			}
		}
	}

	// 📝 Log inicial
	fmt.Printf("🧼 SOAP - Iniciando ejecución\n")
	fmt.Printf("   Nodo ID: %s\n", nodo.ID)
	fmt.Printf("   Método extraído del nodo: '%s'\n", objeto)

	// 🧱 Extraer configuración del servidor
	extras := servidor.Extras
	soapActionBase, _ := extras["soapAction"].(string)
	namespace, _ := extras["namespace"].(string)
	timeout, _ := extras["timeout"].(string)

	// 🎯 Construir SOAPAction completo: soapActionBase + método del nodo
	var soapAction string
	if soapActionBase != "" {
		// Si el soapActionBase termina con '/', agregar método directamente
		if strings.HasSuffix(soapActionBase, "/") {
			soapAction = soapActionBase + objeto
		} else {
			// Si no termina con '/', agregar '/' + método
			soapAction = soapActionBase + "/" + objeto
		}
	} else {
		// Si no hay soapActionBase, usar solo el método
		soapAction = objeto
	}

	// Valores por defecto
	if namespace == "" {
		namespace = "http://tempuri.org/"
	}

	// 🌐 Usar directamente el host tal como está configurado
	serviceURL := servidor.Host

	// 📝 Log de configuración
	fmt.Printf("   Servidor ID: %s\n", servidor.ID)
	fmt.Printf("   Service URL: '%s'\n", serviceURL)
	fmt.Printf("   SOAPAction base: '%s'\n", soapActionBase)
	fmt.Printf("   SOAPAction final: '%s'\n", soapAction)
	fmt.Printf("   Namespace: '%s'\n", namespace)
	fmt.Printf("   Timeout: '%s'\n", timeout)

	// 🧩 Construir SOAP Envelope
	soapXML, err := construirSOAPEnvelope(objeto, namespace, resultado)
	if err != nil {
		return "", fmt.Errorf("error construyendo SOAP envelope: %w", err)
	}

	// 📝 Log del XML generado
	fmt.Printf("   📄 SOAP XML generado:\n%s\n", soapXML)

	// 🧠 Preparar request HTTP
	req, err := http.NewRequest("POST", serviceURL, bytes.NewReader([]byte(soapXML)))
	if err != nil {
		return "", fmt.Errorf("error creando request HTTP: %w", err)
	}

	// 🧱 Headers SOAP obligatorios
	req.Header.Set("Content-Type", "text/xml; charset=utf-8")
	if soapAction != "" {
		req.Header.Set("SOAPAction", fmt.Sprintf("\"%s\"", soapAction))
	}

	// 📝 Log de headers
	fmt.Printf("   📋 Headers HTTP:\n")
	fmt.Printf("      Content-Type: text/xml; charset=utf-8\n")
	if soapAction != "" {
		fmt.Printf("      SOAPAction: \"%s\"\n", soapAction)
	}

	// 🔐 Autenticación básica si está configurada
	if auth, ok := extras["auth"].(map[string]interface{}); ok {
		if usuario, okU := auth["usuario"].(string); okU {
			if clave, okC := auth["clave"].(string); okC {
				req.SetBasicAuth(usuario, clave)
			}
		}
	}

	// 🧱 Headers extras del servidor
	for k, v := range extras {
		if k == "auth" || k == "soapAction" || k == "namespace" || k == "timeout" {
			continue // Skip campos especiales
		}
		vStr := strings.TrimSpace(fmt.Sprint(v))
		if vStr != "" {
			req.Header.Set(k, vStr)
		}
	}

	// 🕒 Timeout
	timeoutDuration := 30 * time.Second // Timeout mayor para SOAP
	if timeout != "" {
		if tParsed, err := time.ParseDuration(timeout); err == nil {
			timeoutDuration = tParsed
		}
	}
	client := &http.Client{Timeout: timeoutDuration}

	// 🚀 Ejecutar petición SOAP
	fmt.Printf("   🚀 Ejecutando POST a: %s\n", serviceURL)
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("   ❌ Error en petición HTTP: %v\n", err)
		return "", fmt.Errorf("error ejecutando petición SOAP: %w", err)
	}
	defer resp.Body.Close()

	// 📝 Log de respuesta HTTP
	fmt.Printf("   📨 Respuesta HTTP: %d %s\n", resp.StatusCode, resp.Status)

	// 📦 Leer respuesta
	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error leyendo respuesta SOAP: %w", err)
	}

	fullOutput := string(respBytes)
	resultado["FullOutput"] = fullOutput

	// 📝 Log de respuesta completa
	fmt.Printf("   📄 Respuesta XML (%d bytes):\n", len(fullOutput))
	if len(fullOutput) > 500 {
		fmt.Printf("   %s...\n", fullOutput[:500])
	} else {
		fmt.Printf("   %s\n", fullOutput)
	}

	// 🚨 Verificar si hay SOAP Fault
	if strings.Contains(fullOutput, "soap:Fault") || strings.Contains(fullOutput, "faultcode") {
		fmt.Printf("   ⚠️ SOAP Fault detectado\n")
		fault, err := parsearSOAPFault(fullOutput)
		if err == nil {
			fmt.Printf("   ❌ Fault Code: %s\n", fault.Code)
			fmt.Printf("   ❌ Fault String: %s\n", fault.String)
			return fullOutput, fmt.Errorf("SOAP Fault: %s - %s", fault.Code, fault.String)
		}
	}

	tagPadre := ""
	if tp, ok := nodo.Data["tagPadre"].(string); ok {
		tagPadre = tp
	}

	// ✅ Verificar código HTTP
	if resp.StatusCode != http.StatusOK {
		return fullOutput, fmt.Errorf("HTTP error %d: %s", resp.StatusCode, resp.Status)
	}

	// 🧠 Si parsearFullOutput está activo → usar la misma lógica que REST
	parsear := false
	if val, ok := nodo.Data["parsearFullOutput"].(bool); ok {
		parsear = val
	}

	if parsear {
		fmt.Printf("   🔍 Parseando respuesta XML automáticamente...\n")

		salidaRaw, tiene := nodo.Data["parametrosSalida"]

		// Verificar si no hay campos definidos o si el array está vacío
		debeGenerar := false
		if !tiene || salidaRaw == nil {
			debeGenerar = true
		} else {
			// Verificar si parametrosSalida es un array vacío
			if salidaBytes, err := json.Marshal(salidaRaw); err == nil {
				var camposSalida []estructuras.Campo
				if err := json.Unmarshal(salidaBytes, &camposSalida); err == nil {
					if len(camposSalida) == 0 {
						debeGenerar = true
					}
				}
			}
		}

		if debeGenerar {
			// Si no hay campos definidos o están vacíos, generarlos automáticamente desde XML
			fmt.Printf("   🔧 Generando campos automáticamente desde XML...\n")
			camposGenerados := generarCamposDesdeXMLSOAP(fullOutput, objeto)
			if len(camposGenerados) > 0 {
				nodo.Data["parametrosSalida"] = camposGenerados
				nodo.Data["parsearFullOutput"] = false

				// 💾 Guardar en flujo usando ProcesoID pasado como parámetro
				if procesoID != "" && len(procesoID) > 0 {
					nodo.ProcesoID = procesoID
					if err := database.ActualizarNodoEnFlujo(nodo); err != nil {
						fmt.Printf("   ⚠️ Error guardando campos en flujo: %v\n", err)
					} else {
						fmt.Printf("   💾 Campos guardados en flujo\n")
					}
				} else {
					fmt.Printf("   ⚠️ ProcesoID vacío o no disponible - campos solo en memoria\n")
				}

				fmt.Printf("   ✅ Campos generados: %d\n", len(camposGenerados))

				// 🎯 Ahora extraer los valores reales de esos campos generados
				fmt.Printf("   🎯 Extrayendo valores de campos generados...\n")
				ExtraerValoresDesdeXMLSOAP(fullOutput, camposSalida, resultado, tagPadre)
				for _, campo := range camposGenerados {
					if val, encontrado := resultado[campo.Nombre]; encontrado {
						fmt.Printf("   ✅ Campo '%s' = '%v'\n", campo.Nombre, val)
					} else {
						fmt.Printf("   ⚠️ Campo '%s' no encontrado en XML\n", campo.Nombre)
					}
				}
			} else {
				fmt.Printf("   ⚠️ No se pudieron generar campos automáticamente\n")
			}
		} else {
			// Usar campos definidos para extraer valores desde XML
			fmt.Printf("   🎯 Extrayendo valores desde XML...\n")
			if salidaBytes, err := json.Marshal(salidaRaw); err == nil {
				var camposSalida []estructuras.Campo
				if err := json.Unmarshal(salidaBytes, &camposSalida); err == nil {
					fmt.Printf("   🔍 Buscando %d campos en XML...\n", len(camposSalida))
					ExtraerValoresDesdeXMLSOAP(fullOutput, camposSalida, resultado, tagPadre)
					for _, campo := range camposSalida {
						if val, encontrado := resultado[campo.Nombre]; encontrado {
							fmt.Printf("   ✅ Campo '%s' = '%v'\n", campo.Nombre, val)
						} else {
							fmt.Printf("   ⚠️ Campo '%s' no encontrado\n", campo.Nombre)
						}
					}
				}
			}
		}
	} else {
		fmt.Printf("   ℹ️ parsearFullOutput: false - solo guardando FullOutput\n")
		if !parsear {
			salidaRaw, tiene := nodo.Data["parametrosSalida"]
			if tiene && salidaRaw != nil {
				fmt.Printf("   🎯 Extrayendo manualmente valores desde XML...\n")
				if salidaBytes, err := json.Marshal(salidaRaw); err == nil {
					var camposSalida []estructuras.Campo
					if err := json.Unmarshal(salidaBytes, &camposSalida); err == nil {
						ExtraerValoresDesdeXMLSOAP(fullOutput, camposSalida, resultado, tagPadre)
						for _, campo := range camposSalida {
							if val, encontrado := resultado[campo.Nombre]; encontrado {
								fmt.Printf("   ✅ Campo '%s' = '%v'\n", campo.Nombre, val)
							} else {
								fmt.Printf("   ⚠️ Campo '%s' no encontrado en XML\n", campo.Nombre)
							}
						}
					}
				}
			}
		}

	}

	return fullOutput, nil
}

// construirSOAPEnvelope crea el XML SOAP desde los parámetros de entrada
func construirSOAPEnvelope(metodo, namespace string, parametros map[string]interface{}) (string, error) {
	var xmlBody bytes.Buffer

	// Escribir el tag del método con namespace
	xmlBody.WriteString(fmt.Sprintf("<%s xmlns=\"%s\">", metodo, namespace))

	// Agregar parámetros como elementos XML
	for nombre, valor := range parametros {
		// Skip campos especiales del motor
		if nombre == "FullOutput" || strings.HasPrefix(nombre, "_") {
			continue
		}
		xmlBody.WriteString(fmt.Sprintf("<%s>%v</%s>", nombre, valor, nombre))
	}

	xmlBody.WriteString(fmt.Sprintf("</%s>", metodo))

	// Construir envelope completo
	envelope := fmt.Sprintf(`<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
	<soap:Body>
		%s
	</soap:Body>
</soap:Envelope>`, xmlBody.String())

	return envelope, nil
}

// parsearSOAPFault extrae información de error desde un SOAP Fault
func parsearSOAPFault(xmlResponse string) (*SOAPFault, error) {
	// Estructura para capturar el envelope completo
	type FaultEnvelope struct {
		Body struct {
			Fault SOAPFault `xml:"Fault"`
		} `xml:"Body"`
	}

	var envelope FaultEnvelope
	if err := xml.Unmarshal([]byte(xmlResponse), &envelope); err != nil {
		return nil, err
	}

	return &envelope.Body.Fault, nil
}

// generarCamposDesdeXMLSOAP genera automáticamente campos desde la respuesta XML
func generarCamposDesdeXMLSOAP(xmlResponse string, metodo string) []estructuras.Campo {
	var campos []estructuras.Campo
	decoder := xml.NewDecoder(strings.NewReader(xmlResponse))

	var stack []string
	var currentElement string
	var currentArray string
	var subcamposArray []estructuras.Campo
	var camposVistos = make(map[string]bool)

	fmt.Printf("   🔍 Parseando XML para generar campos (mejorado para arrays)...\n")

	for {
		tok, err := decoder.Token()
		if err != nil {
			break
		}

		switch t := tok.(type) {
		case xml.StartElement:
			nombre := t.Name.Local
			stack = append(stack, nombre)

			// Detectar entrada a un array
			if len(stack) >= 2 {
				padre := stack[len(stack)-2] // tContinent
				if padre == "ListOfContinentsByCodeResult" && nombre == "tContinent" {
					currentArray = nombre
					subcamposArray = []estructuras.Campo{}
					fmt.Printf("   📚 Detectado array: %s[] dentro de %s\n", nombre, padre)
				}
			}

			currentElement = nombre

		case xml.CharData:
			valor := strings.TrimSpace(string(t))
			if valor == "" || len(stack) == 0 || currentElement == "" {
				continue
			}

			if currentArray != "" && len(stack) >= 3 {
				padre := stack[len(stack)-2]
				nombreCampo := stack[len(stack)-1]

				if padre == currentArray {
					campo := estructuras.Campo{
						Nombre: nombreCampo,
						Tipo:   "string",
					}

					existe := false
					for _, c := range subcamposArray {
						if c.Nombre == campo.Nombre {
							existe = true
							break
						}
					}
					if !existe {
						subcamposArray = append(subcamposArray, campo)
						fmt.Printf("   ➕ Subcampo detectado: %s dentro de %s\n", campo.Nombre, currentArray)
					}
				}
			} else {
				// Campo simple fuera de arrays
				if !camposVistos[currentElement] {
					campos = append(campos, estructuras.Campo{
						Nombre: currentElement,
						Tipo:   "string",
					})
					camposVistos[currentElement] = true
					fmt.Printf("   ➕ Campo simple detectado: %s\n", currentElement)
				}
			}

		case xml.EndElement:
			nombre := t.Name.Local

			if nombre == currentArray && len(subcamposArray) > 0 {
				if !camposVistos[nombre] {
					campos = append(campos, estructuras.Campo{
						Nombre:    nombre,
						Tipo:      "array",
						Subcampos: subcamposArray,
					})
					camposVistos[nombre] = true
					fmt.Printf("   ✅ Campo array registrado: %s[] con %d subcampos\n", nombre, len(subcamposArray))
				}
				currentArray = ""
				subcamposArray = nil
			}

			// Limpiar stack
			if len(stack) > 0 {
				stack = stack[:len(stack)-1]
			}
			if currentElement == nombre {
				currentElement = ""
			}
		}
	}

	fmt.Printf("   📊 Total de campos generados: %d\n", len(campos))
	return campos
}

// Estructura auxiliar genérica para parsear el XML a un map anidado
func xmlToMap(xmlData string) (map[string]interface{}, error) {
	var result map[string]interface{}
	decoder := xml.NewDecoder(strings.NewReader(xmlData))
	result = make(map[string]interface{})
	var current string
	for {
		tok, err := decoder.Token()
		if err != nil {
			break
		}
		switch tok := tok.(type) {
		case xml.StartElement:
			current = tok.Name.Local
		case xml.CharData:
			content := strings.TrimSpace(string(tok))
			if content != "" {
				result[current] = content
			}
		}
	}
	return result, nil
}

func ExtraerValoresDesdeXMLSOAP(xmlString string, campos []estructuras.Campo, resultado map[string]interface{}, tagPadre string) {
	doc := etree.NewDocument()
	if err := doc.ReadFromString(xmlString); err != nil {
		fmt.Printf("❌ error parseando XML: %v\n", err)
		return
	}

	root := doc.Root()
	if root == nil {
		fmt.Println("⚠️ XML sin root")
		return
	}

	// Punto de entrada para búsqueda
	startElement := root
	if tagPadre != "" {
		n := root.FindElement(".//" + tagPadre)
		if n != nil {
			startElement = n
		} else {
			fmt.Printf("⚠️ tagPadre '%s' no encontrado, se usará raíz\n", tagPadre)
		}
	}

	for _, campo := range campos {
		if campo.Tipo == "array" && len(campo.Subcampos) > 0 {
			nodos := startElement.FindElements(".//" + campo.Nombre)
			var valoresArray []map[string]interface{}

			for _, nodo := range nodos {
				obj := make(map[string]interface{})
				for _, subcampo := range campo.Subcampos {
					subNodo := nodo.FindElement(".//" + subcampo.Nombre)
					if subNodo != nil {
						obj[subcampo.Nombre] = subNodo.Text()
					}
				}
				valoresArray = append(valoresArray, obj)
			}

			fmt.Printf("✅ Campo '%s' = '%v'\n", campo.Nombre, valoresArray)
			resultado[campo.Nombre] = valoresArray

		} else {
			// Buscar todos los elementos con este nombre (podría ser array)
			nodos := startElement.FindElements(".//" + campo.Nombre)
			if len(nodos) > 1 {
				// Múltiples elementos = array automático
				var valoresArray []map[string]interface{}
				for _, nodo := range nodos {
					// Extraer todos los sub-elementos del nodo
					obj := make(map[string]interface{})
					for _, child := range nodo.ChildElements() {
						obj[child.Tag] = child.Text()
					}
					if len(obj) > 0 {
						valoresArray = append(valoresArray, obj)
					} else {
						// Si no tiene hijos, usar el texto del elemento
						valoresArray = append(valoresArray, map[string]interface{}{"value": nodo.Text()})
					}
				}
				fmt.Printf("✅ Campo array auto-detectado '%s' = %v elementos\n", campo.Nombre, len(valoresArray))
				resultado[campo.Nombre] = valoresArray
			} else if len(nodos) == 1 {
				// Un solo elemento
				valor := nodos[0].Text()
				fmt.Printf("✅ Campo simple '%s' = '%s'\n", campo.Nombre, valor)
				resultado[campo.Nombre] = valor
			} else {
				fmt.Printf("⚠️ Campo '%s' no encontrado\n", campo.Nombre)
			}
		}
	}
}
