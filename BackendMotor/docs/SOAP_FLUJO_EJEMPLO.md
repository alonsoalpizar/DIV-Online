# 🎯 Conector SOAP - Ejemplo con Flujo Real

## 📋 Flujo de extracción de datos

Basado en la estructura del flujo proporcionada:

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
    "objeto": "usuarios"
  }
}
```

## 🔍 Extracción automática de datos

El conector SOAP extraerá automáticamente:

1. **servidorId**: `bcfd1b58-949e-479e-ad1d-4c7fd06c189a`
2. **objeto**: `usuarios` (será el método SOAP a ejecutar)

## 🗄️ Consulta a base de datos

Con el `servidorId`, el motor buscará en la tabla `servidores`:

```sql
SELECT id, nombre, tipo, host, puerto, extras 
FROM servidores 
WHERE id = 'bcfd1b58-949e-479e-ad1d-4c7fd06c189a'
```

## 📊 Estructura esperada del servidor

```json
{
  "id": "bcfd1b58-949e-479e-ad1d-4c7fd06c189a",
  "nombre": "Servidor SOAP Usuarios",
  "tipo": "SOAP",
  "host": "https://api.miservicio.com/soap/usuarios",
  "puerto": "", 
  "extras": {
    "namespace": "http://miservicio.com/usuarios/",
    "soapAction": "http://miservicio.com/usuarios/ConsultarUsuarios",
    "timeout": "30s",
    "auth": {
      "usuario": "sistema",
      "clave": "password123"
    }
  }
}
```

## 🔧 Construcción automática del SOAP

Con los datos extraídos, el conector construye:

### URL del servicio:
```
https://api.miservicio.com/soap/usuarios
```

### SOAP Envelope:
```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <usuarios xmlns="http://miservicio.com/usuarios/">
      <parametro1>valor1</parametro1>
      <parametro2>valor2</parametro2>
    </usuarios>
  </soap:Body>
</soap:Envelope>
```

### Headers HTTP:
```
POST /soap/usuarios HTTP/1.1
Host: api.miservicio.com
Content-Type: text/xml; charset=utf-8
SOAPAction: "http://miservicio.com/usuarios/ConsultarUsuarios"
Authorization: Basic c2lzdGVtYTpwYXNzd29yZDEyMw==
```

## ⚙️ Campos importantes del extras

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `namespace` | Namespace XML del método SOAP | `"http://miservicio.com/usuarios/"` |
| `soapAction` | Header SOAPAction (si es requerido) | `"http://miservicio.com/usuarios/ConsultarUsuarios"` |
| `timeout` | Tiempo límite de la operación | `"30s"` |
| `auth.usuario` | Usuario para autenticación básica | `"sistema"` |
| `auth.clave` | Contraseña para autenticación básica | `"password123"` |

## 🎭 Ejemplo paso a paso

### 1. Motor detecta nodo proceso tipo SOAP:
```go
tipoServidor := strings.ToLower(servidor.Tipo) // "soap"
// Llama a: ejecutores.EjecutarSOAP(nodo, resultado, servidor)
```

### 2. Extracción de configuración:
```go
objeto := "usuarios" // desde nodo.Data["objeto"]
serviceURL := "https://api.miservicio.com/soap/usuarios" // desde servidor.Host
soapAction := "http://miservicio.com/usuarios/ConsultarUsuarios" // desde extras
namespace := "http://miservicio.com/usuarios/" // desde extras
```

### 3. Construcción del envelope:
```go
soapXML := construirSOAPEnvelope("usuarios", namespace, parametrosEntrada)
```

### 4. Ejecución HTTP POST:
```go
req.Header.Set("Content-Type", "text/xml; charset=utf-8")
req.Header.Set("SOAPAction", "\"" + soapAction + "\"")
resp, err := client.Do(req)
```

### 5. Procesamiento de respuesta:
```go
fullOutput := string(respBytes) // XML completo de respuesta
resultado["FullOutput"] = fullOutput // Guardado para inspección
// + Parseo automático si parsearFullOutput: true
```

## ✅ Validación

Para verificar que todo funciona:

1. **Servidor configurado** con tipo "SOAP" ✅
2. **Host contiene URL completa** del endpoint ✅  
3. **Extras contiene configuración SOAP** ✅
4. **Nodo tiene objeto definido** ✅
5. **Motor integrado** con caso "soap" ✅

## 🚀 Listo para usar

El conector SOAP está completamente integrado y funcionando con la estructura de flujo existente. Solo necesitas:

1. Configurar el servidor en la base de datos
2. El flujo visual ya tiene la estructura correcta
3. ¡Ejecutar y funciona automáticamente!

**El motor extraerá automáticamente `servidorId` y `objeto`, consultará la configuración en BD, y ejecutará el SOAP correctamente.**