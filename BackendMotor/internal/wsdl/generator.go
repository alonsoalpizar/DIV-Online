package wsdl

import (
	"fmt"
	"strings"
)

func GenerarWSDLCompleto(host, codigo, trigger string, inputFields, outputFields, errorFields []map[string]string) string {
	var b strings.Builder

	b.WriteString(`<?xml version="1.0" encoding="UTF-8"?>`)
	b.WriteString(fmt.Sprintf(`
<definitions xmlns="http://schemas.xmlsoap.org/wsdl/"
             xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
             xmlns:tns="http://%s/canal/%s"
             xmlns:xsd="http://www.w3.org/2001/XMLSchema"
             targetNamespace="http://%s/canal/%s">`, host, codigo, host, codigo))

	// Types
	b.WriteString(`
  <types>
    <schema xmlns="http://www.w3.org/2001/XMLSchema" targetNamespace="http://` + host + `/canal/` + codigo + `">`)

	b.WriteString(estructuraElemento("Request", inputFields))
	b.WriteString(estructuraElemento("Response", outputFields))
	if len(errorFields) > 0 {
		b.WriteString(estructuraElemento("ErrorResponse", errorFields))
	}

	b.WriteString(`
    </schema>
  </types>`)

	// Mensajes
	b.WriteString(`
  <message name="RequestMessage">
    <part name="parameters" element="tns:Request"/>
  </message>
  <message name="ResponseMessage">
    <part name="result" element="tns:Response"/>
  </message>`)
	if len(errorFields) > 0 {
		b.WriteString(`
  <message name="ErrorMessage">
    <part name="error" element="tns:ErrorResponse"/>
  </message>`)
	}

	// portType
	b.WriteString(fmt.Sprintf(`
  <portType name="%sPortType">
    <operation name="%s">
      <input message="tns:RequestMessage"/>
      <output message="tns:ResponseMessage"/>
    </operation>
  </portType>`, codigo, trigger))

	// binding
	b.WriteString(fmt.Sprintf(`
  <binding name="%sBinding" type="tns:%sPortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="%s">
      <soap:operation soapAction="%s"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>
  </binding>`, codigo, codigo, trigger, trigger))

	// service
	b.WriteString(fmt.Sprintf(`
  <service name="%sService">
    <port name="%sPort" binding="tns:%sBinding">
      <soap:address location="http://%s/canal/%s"/>
    </port>
  </service>
</definitions>`, codigo, codigo, codigo, host, codigo))

	return b.String()
}

func estructuraElemento(nombre string, campos []map[string]string) string {
	var b strings.Builder
	b.WriteString(`<element name="` + nombre + `"><complexType><sequence>`)
	for _, campo := range campos {
		tipo := mapearTipo(campo["tipo"])
		b.WriteString(fmt.Sprintf(`<element name="%s" type="xsd:%s"/>`, campo["nombre"], tipo))
	}
	b.WriteString(`</sequence></complexType></element>`)
	return b.String()
}

func mapearTipo(t string) string {
	switch t {
	case "int":
		return "int"
	case "float":
		return "float"
	case "bool":
		return "boolean"
	default:
		return "string"
	}
}
