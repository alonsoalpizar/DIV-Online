package publicador

import (
	"fmt"
	"strings"
)

// construye la respuesta SOAP con el tag de respuesta envolviendo un JSON string
func construirSOAPResponse(tag string, payload string) string {
	xmlResponse := `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <%s>%s</%s>
  </soap:Body>
</soap:Envelope>`

	tag = strings.TrimSpace(tag)
	return fmt.Sprintf(xmlResponse, tag, payload, tag)
}
