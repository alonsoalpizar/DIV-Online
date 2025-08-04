package publicador

import (
	"fmt"
	"net/http"
	"strings"

	"backendmotor/internal/ejecucion"
	"encoding/json"

	"github.com/gin-gonic/gin"
)

func WSDLHandler(c *gin.Context) {
	codigo := c.Param("codigo")
	fmt.Printf("🔍 Ingresando a WSDLHandler para canal: %s\n", codigo)

	canal, ok := CanalesPublicados[codigo]
	if !ok {
		fmt.Printf("❌ Canal %s no encontrado\n", codigo)
		c.String(http.StatusNotFound, "Canal no encontrado")
		return
	}

	if strings.ToUpper(canal.TipoPublicacion) != "SOAP" {
		fmt.Printf("⚠️ Canal %s no es de tipo SOAP (%s)\n", codigo, canal.TipoPublicacion)
		c.String(http.StatusBadRequest, "El canal no es de tipo SOAP")
		return
	}

	fmt.Printf("✅ Canal %s encontrado y es de tipo SOAP\n", codigo)
	fmt.Printf("🧵 Métodos publicados: %d\n", len(canal.Metodos))

	handlerPath := "canal"
	if strings.Contains(c.Request.RequestURI, "/wsdl_motor/") {
		handlerPath = "motor"
	}
	targetNS := fmt.Sprintf("http://%s/%s/%s", c.Request.Host, handlerPath, codigo)

	xml := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://schemas.xmlsoap.org/wsdl/"
             xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
             xmlns:tns="%s"
             xmlns:xsd="http://www.w3.org/2001/XMLSchema"
             targetNamespace="%s">
  <types>
    <xsd:schema targetNamespace="%s">
`, targetNS, targetNS, targetNS)

	// Elementos por método
	for _, metodo := range canal.Metodos {
		fmt.Printf("➡️ Generando definición para método: %s\n", metodo.Trigger)

		nodoEntrada := obtenerNodoDesdeProceso(metodo.ProcesoID, "entrada")
		nodoSalida := obtenerNodoDesdeProceso(metodo.ProcesoID, "salida")
		nodoError := obtenerNodoDesdeProceso(metodo.ProcesoID, "salidaError")

		fmt.Printf("   - Nodo entrada: %s\n", nodoEntrada.Type)
		fmt.Printf("   - Nodo salida: %s\n", nodoSalida.Type)
		fmt.Printf("   - Nodo error: %s\n", nodoError.Type)

		xml += generarXsdElemento("Request_"+metodo.Trigger, nodoEntrada.Data["campos"])
		xml += generarXsdElemento("Response_"+metodo.Trigger, nodoSalida.Data["campos"])
		xml += generarXsdElemento("ErrorResponse_"+metodo.Trigger, nodoError.Data["campos"])
	}

	xml += `    </xsd:schema>
  </types>
`

	for _, metodo := range canal.Metodos {
		xml += fmt.Sprintf(`
  <message name="Request_%sMsg">
    <part name="parameters" element="tns:Request_%s"/>
  </message>
  <message name="Response_%sMsg">
    <part name="result" element="tns:Response_%s"/>
  </message>
  <message name="ErrorResponse_%sMsg">
    <part name="result" element="tns:ErrorResponse_%s"/>
  </message>
`, metodo.Trigger, metodo.Trigger, metodo.Trigger, metodo.Trigger, metodo.Trigger, metodo.Trigger)
	}

	xml += fmt.Sprintf(`
  <portType name="%sPortType">
`, codigo)

	for _, metodo := range canal.Metodos {
		xml += fmt.Sprintf(`    <operation name="%s">
      <input message="tns:Request_%sMsg"/>
      <output message="tns:Response_%sMsg"/>
      <fault name="Error" message="tns:ErrorResponse_%sMsg"/>
    </operation>
`, metodo.Trigger, metodo.Trigger, metodo.Trigger, metodo.Trigger)
	}

	xml += fmt.Sprintf(`  </portType>
  <binding name="%sBinding" type="tns:%sPortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
`, codigo, codigo)

	for _, metodo := range canal.Metodos {
		xml += fmt.Sprintf(`    <operation name="%s">
      <soap:operation soapAction="%s"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
      <fault name="Error"><soap:fault name="Error" use="literal"/></fault>
    </operation>
`, metodo.Trigger, metodo.Trigger)
	}

	xml += fmt.Sprintf(`  </binding>
  <service name="%sService">
    <port name="%sPort" binding="tns:%sBinding">
      <soap:address location="http://%s/%s/%s"/>
    </port>
  </service>
</definitions>`, codigo, codigo, codigo, c.Request.Host, handlerPath, codigo)

	fmt.Println("🧾 WSDL generado correctamente, enviando respuesta...")
	c.Header("Content-Type", "text/xml")
	c.String(http.StatusOK, xml)
}

func generarXsdElemento(nombre string, camposInterface interface{}) string {
	xml := fmt.Sprintf(`      <xsd:element name="%s">
        <xsd:complexType><xsd:sequence>
`, nombre)

	campos, ok := camposInterface.([]interface{})
	if !ok {
		return ""
	}

	for _, campo := range campos {
		m, ok := campo.(map[string]interface{})
		if !ok {
			continue
		}
		tipo := mapTipoXSD(fmt.Sprint(m["tipo"]))
		xml += fmt.Sprintf(`          <xsd:element name="%s" type="xsd:%s"/>
`, m["nombre"], tipo)
	}

	xml += `        </xsd:sequence></xsd:complexType>
      </xsd:element>
`
	return xml
}

func obtenerNodoDesdeProceso(procesoID string, tipo string) ejecucion.Nodo {
	proceso, err := ejecucion.ObtenerProcesoDesdeBD(procesoID)
	if err != nil {
		return ejecucion.Nodo{}
	}
	var flujo ejecucion.Flujo
	if err := json.Unmarshal([]byte(proceso.Flujo), &flujo); err != nil {
		return ejecucion.Nodo{}
	}
	for _, nodo := range flujo.Nodes {
		if nodo.Type == tipo {
			return nodo
		}
	}
	return ejecucion.Nodo{}
}

func mapTipoXSD(tipo string) string {
	switch strings.ToLower(tipo) {
	case "int":
		return "int"
	case "float", "decimal":
		return "float"
	case "bool":
		return "boolean"
	default:
		return "string"
	}
}
