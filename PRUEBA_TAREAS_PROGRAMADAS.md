# 📅 PRUEBAS DEL MÓDULO DE TAREAS PROGRAMADAS

## ✅ **Componentes implementados:**

### **1. Base de datos**
- ✅ Modelos `TareaProgramada` y `EjecucionTarea` 
- ✅ Migraciones automáticas configuradas en `div/backend`
- ✅ Mapeo correcto en `BackendMotor` para acceso a las mismas tablas

### **2. API REST (Puerto 30000)**
- ✅ `GET /tareas-programadas` - Listar tareas
- ✅ `POST /tareas-programadas` - Crear tarea
- ✅ `PUT /tareas-programadas/{id}` - Actualizar tarea
- ✅ `DELETE /tareas-programadas/{id}` - Eliminar tarea
- ✅ `POST /tareas-programadas/{id}/ejecutar` - Ejecución manual
- ✅ `GET /tareas-programadas/{id}/ejecuciones` - Historial

### **3. Frontend React**
- ✅ Página `TareasProgramadas` integrada en el menú
- ✅ Lista visual con estado, próxima ejecución, acciones
- ✅ Formulario con selector de programación (cron visual)
- ✅ Utilidades para conversión de expresiones cron
- ✅ Estadísticas rápidas (total, activas, inactivas)

### **4. Scheduler Engine (Puerto 50000)**
- ✅ Sistema que revisa tareas cada minuto
- ✅ Ejecución automática usando `EjecutarFlujo()`
- ✅ Cálculo de próximas ejecuciones
- ✅ Logs detallados de ejecuciones
- ✅ Manejo de errores y persistencia

## 🧪 **Pasos para probar:**

### **Paso 1: Iniciar los servicios**
```bash
# Terminal 1: Iniciar div/backend (API REST)
cd /opt/div/backend
go run main.go

# Terminal 2: Iniciar BackendMotor (Scheduler + Motor)
cd /opt/BackendMotor
go run cmd/server/main.go

# Terminal 3: Iniciar frontend
cd /opt/div/frontend
npm run dev
```

### **Paso 2: Crear una tarea de prueba**
1. Acceder a `http://localhost:5173/tareas-programadas`
2. Hacer clic en "Nueva Tarea"
3. Llenar formulario:
   - **Nombre**: "Tarea de Prueba"
   - **Proceso**: Seleccionar un proceso existente
   - **Canal**: Seleccionar un canal existente
   - **Programación**: "Cada 5 minutos"
   - **Parámetros**: `{"test": true}`
4. Guardar

### **Paso 3: Verificar funcionamiento**
- ✅ La tarea aparece en la lista
- ✅ Estado muestra "ACTIVO"
- ✅ Próxima ejecución calculada correctamente
- ✅ Ejecución manual funciona (botón ▶️)
- ✅ BackendMotor ejecuta automáticamente cada 5 minutos
- ✅ Historial de ejecuciones se registra

## 🔧 **Funcionalidades principales:**

### **Programación flexible:**
- **Cada X minutos**: `*/5 * * * *`
- **Cada X horas**: `0 */2 * * *`
- **Diario**: `0 8 * * *` (8:00 AM)
- **Semanal**: `0 8 * * 1` (Lunes 8:00 AM)
- **Mensual**: `0 8 1 * *` (Día 1 del mes, 8:00 AM)
- **Personalizado**: Expresión cron libre

### **Estados de ejecución:**
- 🟡 **ejecutando**: En proceso
- 🟢 **exitoso**: Completado correctamente
- 🔴 **error**: Falló la ejecución

### **Triggers:**
- **programado**: Ejecutado por el scheduler
- **manual**: Ejecutado manualmente desde la UI

## 📊 **Monitoreo incluido:**
- Logs detallados en `BackendMotor`
- Historial de ejecuciones por tarea
- Estadísticas en tiempo real
- Control de estado activo/inactivo

## 🚀 **Próximas mejoras sugeridas:**
1. Librería `github.com/robfig/cron` para parsing robusto
2. Notificaciones por email/webhook en errores
3. Dashboard de métricas avanzadas
4. Paralelización de ejecuciones
5. Retry automático en fallos