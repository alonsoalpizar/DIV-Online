# Cliente de Pruebas Interno - DIV

## Descripción

El **Cliente de Pruebas Interno** es una herramienta integrada en DIV que permite probar procesos de integración sin salir del sistema, eliminando la dependencia de herramientas externas como Postman o curl.

## Acceso

### 🎯 Método de Acceso
1. **Menú de Configuración**: Click en la tuerca (⚙️) en el topbar superior derecha
2. **Seleccionar**: "🧪 Cliente de Pruebas"
3. **URL directa**: `http://localhost:5173/test-client`

## Funcionalidades

### ✨ Características Principales

- **🔗 Integración completa**: Comunicación directa con BackendMotor
- **📋 Selector de canales**: Lista automática de canales configurados
- **🏷️ Sugerencias de triggers**: Autocompletado basado en canal seleccionado
- **📝 Editor JSON**: Entrada de tramas con validación sintáctica
- **📊 Resultados estructurados**: Visualización clara de respuestas
- **⚡ Indicador de conexión**: Estado en tiempo real del backend
- **🎨 UX optimizada**: Loading states y feedback visual

### 🛠️ Interfaz de Usuario

#### Panel de Configuración
1. **Selector de Canal**: Dropdown con todos los canales disponibles
2. **Campo de Trigger**: Input con sugerencias de triggers existentes
3. **Editor de Trama**: Textarea con validación JSON en tiempo real
4. **Botones de Acción**: Ejecutar, Limpiar, Copiar resultado

#### Panel de Resultados
- **Estado visual**: ✅ Exitoso / ❌ Error
- **Duración**: Tiempo de ejecución del test
- **Respuesta completa**: JSON formateado con scroll
- **Botón copiar**: Para exportar resultados

## Ejemplos de Uso

### 📋 Ejemplo 1: Proceso Simple
```json
{
  "canal": "C001",
  "trigger": "consulta|GET", 
  "trama": {
    "Empresa": "TestCompany"
  }
}
```

### 📋 Ejemplo 2: Proceso con Validación
```json
{
  "canal": "C001",
  "trigger": "Condicion|POST",
  "trama": {
    "Numero": 15
  }
}
```

### 📋 Ejemplo 3: Proceso REST
```json
{
  "canal": "C001", 
  "trigger": "usuarios|GET",
  "trama": {}
}
```

## Arquitectura Técnica

### 🏗️ Flujo de Datos
```
Frontend → div/backend:30000 → BackendMotor:50000 → Respuesta
```

### 📡 Endpoints
- **Frontend**: `POST /test-cliente/ejecutar`
- **Backend**: Proxy a BackendMotor
- **Motor**: `POST /ejecutar-proceso`

### 🔧 Componentes

#### Backend (Go)
- **Modelo**: `models/test_cliente.go`
- **Controller**: `controllers/test_cliente_controller.go`
- **Ruta**: `/test-cliente/ejecutar`

#### Frontend (React + TypeScript)
- **Página**: `pages/TestClient.tsx`
- **Tipos**: `types/testCliente.ts`
- **Navegación**: Integrada en `components/Topbar.tsx`

## Validaciones y Manejo de Errores

### ✅ Validaciones Implementadas
- Canal obligatorio
- Trigger no vacío
- JSON válido en trama
- Conexión con backend

### 🚨 Tipos de Error
1. **Validación**: Campos requeridos, JSON malformado
2. **Configuración**: Canal/trigger no encontrado
3. **Comunicación**: Backend no disponible, timeout
4. **Ejecución**: Errores del motor de procesos

### 📝 Mensajes de Error Específicos
- `"No hay proceso configurado para el canal X con trigger Y"`
- `"Error de comunicación con el motor de ejecución"`
- `"La trama debe ser un JSON válido"`
- `"Backend no disponible en puerto 30000"`

## Estados de Conexión

### 🟡 Verificando
- Validando conectividad con backend
- Animación de pulse en indicador

### 🟢 Conectado  
- Backend disponible y respondiendo
- Funcionalidad completa habilitada

### 🔴 Desconectado
- Backend no disponible
- Botón de reintentar disponible
- Funcionalidad limitada

## Beneficios

### 🎯 Para Desarrolladores
- **Sin herramientas externas**: Todo integrado
- **Autocompletado inteligente**: Canales y triggers reales
- **Feedback inmediato**: Errores claros y específicos
- **Historial visual**: Resultados persistentes en sesión

### 🎯 Para Testing
- **Pruebas rápidas**: Sin configurar clientes externos
- **Datos reales**: Usa configuraciones del sistema
- **Debug simplificado**: Errores en contexto
- **Validación inmediata**: JSON y conectividad

## Limitaciones Actuales

- **Sin historial persistente**: Resultados se pierden al refrescar
- **Un test a la vez**: No ejecución paralela
- **Sin templates**: No plantillas de trama predefinidas
- **Sin export**: No exportar resultados a archivo

## Roadmap Futuro

### 🚀 Mejoras Planificadas
- **Historial de tests**: Persistir ejecutuciones
- **Templates de trama**: Plantillas por tipo de proceso  
- **Export de resultados**: PDF, JSON, CSV
- **Tests batch**: Ejecución múltiple
- **Métricas**: Estadísticas de uso y performance

---

## Instalación y Deploy

### 🔧 Backend
1. Archivos agregados al sistema existente
2. Reiniciar `div/backend` para activar nuevas rutas
3. Verificar conectividad con BackendMotor:50000

### 🎨 Frontend  
1. Componentes integrados en build existente
2. Acceso via menú de configuración
3. Sin configuración adicional requerida

**Estado**: ✅ **Producción Ready** - Implementación completa y probada