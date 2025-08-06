package scheduler

import (
	"backendmotor/internal/database"
	"backendmotor/internal/ejecucion"
	"backendmotor/internal/utils"
	"log"
	"sync"
	"time"
	"gorm.io/datatypes"
	"github.com/google/uuid"
	"strings"
	"strconv"
	"fmt"
)

type Scheduler struct {
	tareas       map[string]*TareaProgramada
	mutex        sync.RWMutex
	ticker       *time.Ticker
	stopChannel  chan bool
	intervalo    time.Duration
	ejecutando   bool
}

// Modelos locales que mapean a las tablas del div/backend
type TareaProgramada struct {
	ID                string            `gorm:"type:uuid;primaryKey;column:id" json:"id"`
	Nombre            string            `gorm:"column:nombre" json:"nombre"`
	ProcesoID         string            `gorm:"column:proceso_id" json:"procesoId"`
	CanalCodigo       string            `gorm:"column:canal_codigo" json:"canalCodigo"` // Opcional
	ExpresionCron     string            `gorm:"column:expresion_cron" json:"expresionCron"`
	Activo            bool              `gorm:"column:activo" json:"activo"`
	ParametrosEntrada datatypes.JSONMap `gorm:"column:parametros_entrada" json:"parametrosEntrada"`
	UltimaEjecucion   *time.Time        `gorm:"column:ultima_ejecucion" json:"ultimaEjecucion"`
	ProximaEjecucion  *time.Time        `gorm:"column:proxima_ejecucion" json:"proximaEjecucion"`
}

func (TareaProgramada) TableName() string {
	return "tareas_programadas"
}

type EjecucionTarea struct {
	ID                string            `gorm:"type:uuid;primaryKey;column:id" json:"id"`
	TareaProgramadaID string            `gorm:"column:tarea_programada_id" json:"tareaProgramadaId"`
	FechaEjecucion    time.Time         `gorm:"column:fecha_ejecucion" json:"fechaEjecucion"`
	Estado            string            `gorm:"column:estado" json:"estado"`
	DuracionMs        int64             `gorm:"column:duracion_ms" json:"duracionMs"`
	Resultado         datatypes.JSONMap `gorm:"column:resultado" json:"resultado"`
	MensajeError      string            `gorm:"column:mensaje_error" json:"mensajeError"`
	Trigger           string            `gorm:"column:trigger" json:"trigger"`
}

func (EjecucionTarea) TableName() string {
	return "ejecuciones_tareas"
}

// Nueva instancia del scheduler
func NuevoScheduler() *Scheduler {
	return &Scheduler{
		tareas:      make(map[string]*TareaProgramada),
		intervalo:   time.Minute, // Revisar cada minuto
		stopChannel: make(chan bool),
		ejecutando:  false,
	}
}

// Iniciar el scheduler
func (s *Scheduler) Iniciar() {
	if s.ejecutando {
		return
	}

	log.Println("🕐 Iniciando scheduler de tareas programadas...")
	s.ejecutando = true
	s.ticker = time.NewTicker(s.intervalo)

	// Cargar tareas iniciales
	s.cargarTareas()

	go func() {
		for {
			select {
			case <-s.ticker.C:
				s.procesarTareas()
			case <-s.stopChannel:
				s.ticker.Stop()
				s.ejecutando = false
				log.Println("🛑 Scheduler detenido")
				return
			}
		}
	}()

	log.Println("✅ Scheduler iniciado correctamente")
}

// Detener el scheduler
func (s *Scheduler) Detener() {
	if !s.ejecutando {
		return
	}
	s.stopChannel <- true
}

// Cargar tareas desde la base de datos
func (s *Scheduler) cargarTareas() {
	db := database.DBGORM
	var tareasDB []TareaProgramada

	if err := db.Where("activo = ?", true).Find(&tareasDB).Error; err != nil {
		log.Printf("❌ Error al cargar tareas programadas: %v", err)
		return
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Limpiar tareas existentes
	s.tareas = make(map[string]*TareaProgramada)

	// Cargar nuevas tareas
	for _, tareaDB := range tareasDB {
		tarea := &TareaProgramada{
			ID:                tareaDB.ID,
			Nombre:            tareaDB.Nombre,
			ProcesoID:         tareaDB.ProcesoID,
			CanalCodigo:       tareaDB.CanalCodigo,
			ExpresionCron:     tareaDB.ExpresionCron,
			Activo:            tareaDB.Activo,
			ParametrosEntrada: tareaDB.ParametrosEntrada,
			ProximaEjecucion:  tareaDB.ProximaEjecucion,
		}

		// Si no tiene próxima ejecución calculada, calcularla
		if tarea.ProximaEjecucion == nil {
			if proximaEjecucion, err := calcularProximaEjecucion(tarea.ExpresionCron); err == nil {
				tarea.ProximaEjecucion = &proximaEjecucion
				// Actualizar en base de datos
				db.Model(&tareaDB).Update("proxima_ejecucion", proximaEjecucion)
			}
		}

		s.tareas[tarea.ID] = tarea
	}

	log.Printf("📋 Cargadas %d tareas programadas activas", len(s.tareas))
}

// Procesar tareas que deben ejecutarse
func (s *Scheduler) procesarTareas() {
	ahora := time.Now()
	
	s.mutex.RLock()
	tareasAEjecutar := make([]*TareaProgramada, 0)
	
	for _, tarea := range s.tareas {
		if tarea.Activo && tarea.ProximaEjecucion != nil && 
		   ahora.After(*tarea.ProximaEjecucion) {
			tareasAEjecutar = append(tareasAEjecutar, tarea)
		}
	}
	s.mutex.RUnlock()

	// Ejecutar tareas pendientes
	for _, tarea := range tareasAEjecutar {
		go s.ejecutarTarea(tarea)
	}

	// Recargar tareas cada 5 minutos para detectar cambios
	if ahora.Minute()%5 == 0 && ahora.Second() < 60 {
		s.cargarTareas()
	}
}

// Ejecutar una tarea específica
func (s *Scheduler) ejecutarTarea(tarea *TareaProgramada) {
	inicioEjecucion := time.Now()
	log.Printf("▶️ Ejecutando tarea programada: %s (Proceso: %s)", tarea.Nombre, tarea.ProcesoID)

	// Crear registro de ejecución
	registroEjecucion := EjecucionTarea{
		ID:                generarUUID(),
		TareaProgramadaID: tarea.ID,
		FechaEjecucion:    inicioEjecucion,
		Estado:            "ejecutando",
		Trigger:           "programado",
	}

	// Guardar registro inicial
	s.guardarEjecucion(&registroEjecucion)

	// Ejecutar el proceso usando el motor existente
	// Para tareas programadas usamos canal interno o el especificado
	canalEjecucion := "SCHEDULER"
	if tarea.CanalCodigo != "" {
		canalEjecucion = tarea.CanalCodigo
	}
	resultado, err := ejecucion.EjecutarFlujo(tarea.ProcesoID, tarea.ParametrosEntrada, canalEjecucion, "scheduler")
	
	// Actualizar registro de ejecución
	registroEjecucion.DuracionMs = time.Since(inicioEjecucion).Milliseconds()
	
	if err != nil {
		registroEjecucion.Estado = "error"
		registroEjecucion.MensajeError = err.Error()
		log.Printf("❌ Error ejecutando tarea %s: %v", tarea.Nombre, err)
	} else {
		registroEjecucion.Estado = "exitoso"
		registroEjecucion.Resultado = map[string]interface{}{
			"estado":    resultado.Estado,
			"mensaje":   resultado.Mensaje,
			"datos":     resultado.Datos,
			"procesoId": resultado.ProcesoID,
		}
		log.Printf("✅ Tarea %s ejecutada exitosamente", tarea.Nombre)
	}

	// Guardar resultado final
	s.guardarEjecucion(&registroEjecucion)

	// Calcular próxima ejecución
	s.actualizarProximaEjecucion(tarea)

	// Registrar en logs
	utils.RegistrarEjecucionLog(utils.RegistroEjecucion{
		Timestamp:     inicioEjecucion.Format(time.RFC3339),
		ProcesoId:     tarea.ProcesoID,
		NombreProceso: tarea.Nombre,
		Canal:         tarea.CanalCodigo,
		TipoObjeto:    "scheduler",
		NombreObjeto:  "Tarea Programada",
		Parametros:    tarea.ParametrosEntrada,
		Resultado:     registroEjecucion.Resultado,
		FullOutput: map[string]interface{}{
			"tareaProgramadaId": tarea.ID,
			"expresionCron":     tarea.ExpresionCron,
			"trigger":           "scheduler",
			"ejecucionId":       registroEjecucion.ID,
		},
		Estado:     registroEjecucion.Estado,
		DuracionMs: registroEjecucion.DuracionMs,
	})
}

// Guardar registro de ejecución en base de datos
func (s *Scheduler) guardarEjecucion(ejecucion *EjecucionTarea) {
	db := database.DBGORM

	if err := db.Save(ejecucion).Error; err != nil {
		log.Printf("❌ Error guardando ejecución: %v", err)
	}
}

// Actualizar próxima ejecución de una tarea
func (s *Scheduler) actualizarProximaEjecucion(tarea *TareaProgramada) {
	proximaEjecucion, err := calcularProximaEjecucion(tarea.ExpresionCron)
	if err != nil {
		log.Printf("❌ Error calculando próxima ejecución para tarea %s: %v", tarea.Nombre, err)
		return
	}

	// Actualizar en memoria
	s.mutex.Lock()
	if tareaEnMemoria, existe := s.tareas[tarea.ID]; existe {
		tareaEnMemoria.ProximaEjecucion = &proximaEjecucion
	}
	s.mutex.Unlock()

	// Actualizar en base de datos
	db := database.DBGORM
	if err := db.Model(&TareaProgramada{}).Where("id = ?", tarea.ID).
		Updates(map[string]interface{}{
			"ultima_ejecucion":  time.Now(),
			"proxima_ejecucion": proximaEjecucion,
		}).Error; err != nil {
		log.Printf("❌ Error actualizando próxima ejecución: %v", err)
	}
}

// Función auxiliar para calcular próxima ejecución
func calcularProximaEjecucion(expresionCron string) (time.Time, error) {
	ahora := time.Now()
	
	// Parsear expresiones del tipo */X * * * * (cada X minutos)
	if strings.HasPrefix(expresionCron, "*/") && strings.HasSuffix(expresionCron, " * * * *") {
		// Extraer el número de minutos
		minutosStr := strings.TrimPrefix(expresionCron, "*/")
		minutosStr = strings.TrimSuffix(minutosStr, " * * * *")
		
		minutos, err := strconv.Atoi(minutosStr)
		if err != nil {
			return time.Time{}, fmt.Errorf("expresión cron inválida: %s", expresionCron)
		}
		
		return ahora.Add(time.Duration(minutos) * time.Minute), nil
	}
	
	// Casos específicos
	switch expresionCron {
	case "0 * * * *": // Cada hora
		return ahora.Add(time.Hour), nil
	case "0 0 * * *": // Diario a medianoche
		proxima := time.Date(ahora.Year(), ahora.Month(), ahora.Day()+1, 0, 0, 0, 0, ahora.Location())
		return proxima, nil
	case "0 0 * * 0": // Semanal (domingos a medianoche)
		diasHastaDomingo := (7 - int(ahora.Weekday())) % 7
		if diasHastaDomingo == 0 {
			diasHastaDomingo = 7
		}
		proxima := time.Date(ahora.Year(), ahora.Month(), ahora.Day()+diasHastaDomingo, 0, 0, 0, 0, ahora.Location())
		return proxima, nil
	default:
		return time.Time{}, fmt.Errorf("expresión cron no soportada: %s", expresionCron)
	}
}

// Función auxiliar para generar UUID
func generarUUID() string {
	return uuid.New().String()
}