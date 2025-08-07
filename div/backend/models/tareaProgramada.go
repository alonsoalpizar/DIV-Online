package models

import (
	"gorm.io/datatypes"
	"time"
)

type TareaProgramada struct {
	ID          string `gorm:"type:uuid;primaryKey" json:"id"`
	Nombre      string `gorm:"not null" json:"nombre"`
	Descripcion string `json:"descripcion"`
	ProcesoID   string `gorm:"not null" json:"procesoId"`
	// Campo opcional para flexibilidad futura
	CanalCodigo        string            `json:"canalCodigo"` // Removido "not null"
	ExpresionCron      string            `gorm:"not null" json:"expresionCron"`
	Activo             bool              `gorm:"default:true" json:"activo"`
	UltimaEjecucion    *time.Time        `json:"ultimaEjecucion"`
	ProximaEjecucion   *time.Time        `json:"proximaEjecucion"`
	ParametrosEntrada  datatypes.JSONMap `json:"parametrosEntrada"`
	FechaCreacion      time.Time         `gorm:"autoCreateTime" json:"fechaCreacion"`
	FechaActualizacion time.Time         `gorm:"autoUpdateTime" json:"fechaActualizacion"`

	// Relaciones
	Proceso *Proceso `json:"proceso,omitempty"`
}

func (TareaProgramada) TableName() string {
	return "tareas_programadas"
}

type EjecucionTarea struct {
	ID                string            `gorm:"type:uuid;primaryKey" json:"id"`
	TareaProgramadaID string            `gorm:"not null" json:"tareaProgramadaId"`
	FechaEjecucion    time.Time         `gorm:"autoCreateTime" json:"fechaEjecucion"`
	Estado            string            `gorm:"not null" json:"estado"` // "exitoso", "error", "ejecutando"
	DuracionMs        int64             `json:"duracionMs"`
	Resultado         datatypes.JSONMap `json:"resultado"`
	MensajeError      string            `json:"mensajeError"`
	Trigger           string            `json:"trigger"` // "programado", "manual"

	// Relación
	TareaProgramada *TareaProgramada `json:"tareaProgramada,omitempty"`
}

func (EjecucionTarea) TableName() string {
	return "ejecuciones_tareas"
}
