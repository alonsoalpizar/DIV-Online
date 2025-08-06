# 🧼 Conector SOAP - Documentación

## 📋 Descripción General

El conector SOAP permite ejecutar operaciones SOAP contra servicios web externos de manera dinámica, integrándose completamente con el motor de ejecución de flujos.

## 🛠️ Configuración del Servidor

Para usar el conector SOAP, debes crear un servidor de tipo "SOAP" con la siguiente configuración:

### Campos básicos:
- **Tipo**: `SOAP`
- **Host**: URL completa del endpoint SOAP (ej: `https://servicios.banco.com/ws/consulta`)
- **Puerto**: No requerido (se incluye en Host si es necesario)

### Campos en `extras`:
```json
{
  "soapAction": "http://servicios.banco.com/Consulta",
  "namespace": "http://servicios.banco.com/",
  "timeout": "30s",
  "auth": {
    "usuario": "admin",
    "clave": "secreto123"
  }
}
```

### Campos del extras explicados:

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `soapAction` | string | Valor del header SOAPAction | No |
| `namespace` | string | Namespace XML del servicio | No* |
| `timeout` | string | Timeout de la operación (ej: "30s") | No |
| `auth` | object | Credenciales para autenticación básica | No |

*Si no se especifica namespace, se usa `http://tempuri.org/` por defecto.

## 🎯 Configuración del Nodo Proceso

En el nodo tipo "proceso" dentro del flujo:

### Campos requeridos:
- **servidorId**: ID del servidor SOAP configurado
- **objeto**: Nombre del método SOAP a ejecutar (ej: "ConsultaSaldo")
- **tipoObjeto**: `soap_operation`

### Ejemplo de nodo:
```json
{
  "id": "proceso_1",
  "type": "proceso",
  "data": {
    "label": "Consultar Saldo",
    "servidorId": "uuid-del-servidor-soap",
    "tipoObjeto": "soap_operation",
    "objeto": "ConsultaSaldo",
    "parametrosEntrada": [
      {"nombre": "NumeroCuenta", "tipo": "string"},
      {"nombre": "TipoConsulta", "tipo": "string"}
    ],
    "parametrosSalida": [
      {"nombre": "Saldo", "tipo": "float"},
      {"nombre": "Estado", "tipo": "string"}
    ],
    "parsearFullOutput": true
  }
}
```

## 🔄 Flujo de Ejecución

### 1. **Construcción del SOAP Envelope**
El conector construye automáticamente un XML válido:

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ConsultaSaldo xmlns="http://servicios.banco.com/">
      <NumeroCuenta>123456789</NumeroCuenta>
      <TipoConsulta>DISPONIBLE</TipoConsulta>
    </ConsultaSaldo>
  </soap:Body>
</soap:Envelope>
```

### 2. **Headers HTTP automáticos**
- `Content-Type: text/xml; charset=utf-8`
- `SOAPAction: "valor_del_soap_action"` (si está configurado)
- `Authorization: Basic xxx` (si hay auth configurado)

### 3. **Respuesta y parseo**
- La respuesta XML completa se guarda en `FullOutput`
- Si `parsearFullOutput: true`, se extraen automáticamente los campos
- Se detectan y manejan SOAP Faults

## 🧪 Ejemplo Completo

### Servidor SOAP:
```json
{
  "id": "bcfd1b58-949e-479e-ad1d-4c7fd06c189a",
  "nombre": "Servicio Bancario SOAP",
  "tipo": "SOAP",
  "host": "https://api.banco.com/ws/consultas",
  "puerto": "",
  "extras": {
    "soapAction": "http://banco.com/ConsultaSaldo",
    "namespace": "http://banco.com/servicios/",
    "timeout": "30s",
    "auth": {
      "usuario": "sistema_div",
      "clave": "clave_secreta"
    }
  }
}
```

### Nodo en el flujo:
```json
{
  "id": "proceso-1754435337147",
  "type": "proceso",
  "position": {
    "x": 5.259407043457031,
    "y": 69.66875457763672
  },
  "data": {
    "label": "Proceso1",
    "servidorId": "bcfd1b58-949e-479e-ad1d-4c7fd06c189a",
    "tipoObjeto": "sp",
    "objeto": "usuarios",
    "parametrosEntrada": [
      {"nombre": "NumeroCliente", "tipo": "string"},
      {"nombre": "TipoCuenta", "tipo": "string"}
    ],
    "parametrosSalida": [
      {"nombre": "SaldoDisponible", "tipo": "float"},
      {"nombre": "SaldoContable", "tipo": "float"},
      {"nombre": "EstadoCuenta", "tipo": "string"}
    ],
    "parsearFullOutput": true
  }
}
```

### Datos de entrada (desde nodo anterior):
```json
{
  "NumeroCliente": "12345678",
  "TipoCuenta": "AHORROS"
}
```

### Resultado esperado:
```json
{
  "SaldoDisponible": 1500.75,
  "SaldoContable": 1500.75,
  "EstadoCuenta": "ACTIVA",
  "FullOutput": "<?xml version=\"1.0\"?>...</soap:Envelope>"
}
```

## 🚨 Manejo de Errores

### SOAP Faults
El conector detecta automáticamente SOAP Faults:
```xml
<soap:Fault>
  <faultcode>Client</faultcode>
  <faultstring>Número de cuenta inválido</faultstring>
  <detail>Cuenta 999999 no existe</detail>
</soap:Fault>
```

### Errores HTTP
- **Timeout**: Error si la operación excede el tiempo configurado
- **404/500**: Errores de servidor se reportan correctamente
- **Autenticación**: Fallas de auth se capturan y reportan

### Errores de configuración
- Servidor no existe: `codigoError: "99"`
- Método no definido: `mensajeError: "método SOAP no definido"`
- WSDL inaccesible: Se reporta el error HTTP correspondiente

## 🔧 Depuración

### Logs automáticos
El conector genera logs detallados:
- Construcción del SOAP envelope
- Headers enviados
- Respuesta recibida
- Campos extraídos

### Campo FullOutput
Siempre disponible para inspeccionar la respuesta XML completa recibida del servicio.

## 🎛️ Configuraciones Avanzadas

### Headers personalizados
Agregar headers adicionales en `extras`:
```json
{
  "Custom-Header": "valor",
  "X-Api-Version": "2.0"
}
```

### Timeouts personalizados
```json
{
  "timeout": "45s"  // Formato: 30s, 2m, 1h
}
```

### Múltiples namespaces
Para servicios complejos, el namespace principal se configura, pero el parser maneja automáticamente múltiples namespaces en la respuesta.

## ✅ Estado de Implementación

- ✅ Construcción automática de SOAP envelope
- ✅ Manejo de headers HTTP requeridos
- ✅ Autenticación básica
- ✅ Parseo de respuestas XML
- ✅ Detección de SOAP Faults
- ✅ Integración con motor de ejecución
- ✅ Generación automática de campos de salida
- ✅ Logging completo
- ✅ Manejo de errores y timeouts

El conector SOAP está **completamente funcional** y listo para usar en producción.