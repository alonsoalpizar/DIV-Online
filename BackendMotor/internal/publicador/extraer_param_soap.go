package publicador

import (
	"bytes"
	"encoding/xml"
	"fmt"
)

// extraerParametrosDesdeSOAP permite extraer parámetros desde cualquier nodo hijo de <Body>
func extraerParametrosDesdeSOAP(body []byte) (map[string]interface{}, error) {
	type Envelope struct {
		Body struct {
			Contenido struct {
				XMLName xml.Name
				Any     []byte `xml:",innerxml"`
			} `xml:",any"`
		} `xml:"Body"`
	}

	var envelope Envelope
	if err := xml.Unmarshal(body, &envelope); err != nil {
		return nil, fmt.Errorf("error unmarshalling SOAP envelope: %v", err)
	}

	contenido := envelope.Body.Contenido.Any
	parametros := make(map[string]interface{})

	decoder := xml.NewDecoder(bytes.NewReader(contenido))
	var currentElement string
	for {
		tok, err := decoder.Token()
		if err != nil {
			break
		}

		switch t := tok.(type) {
		case xml.StartElement:
			currentElement = t.Name.Local
		case xml.CharData:
			if currentElement != "" {
				parametros[currentElement] = string(t)
			}
		case xml.EndElement:
			currentElement = ""
		}
	}

	return parametros, nil
}
