package models

import (
	"time"
	"gorm.io/datatypes"
)

type TareaProgramada struct {
	ID                string            `gorm:"type:uuid;primaryKey" json:"id"`
	Nombre            string            `gorm:"not null" json:"nombre"`
	Descripcion       string            `json:"descripcion"`
	ProcesoID         string            `gorm:"not null" json:"procesoId"`
	CanalCodigo       string            `gorm:"not null" json:"canalCodigo"`
	ExpresionCron     string            `gorm:"not null" json:"expresionCron"`
	Activo            bool              `gorm:"default:true" json:"activo"`
	UltimaEjecucion   *time.Time        `json:"ultimaEjecucion"`
	ProximaEjecucion  *time.Time        `json:"proximaEjecucion"`
	ParametrosEntrada datatypes.JSONMap `json:"parametrosEntrada"`
	FechaCreacion     time.Time         `gorm:"autoCreateTime" json:"fechaCreacion"`
	FechaActualizacion time.Time        `gorm:"autoUpdateTime" json:"fechaActualizacion"`
}

func (TareaProgramada) TableName() string {
	return "tareas_programadas"
}

type EjecucionTarea struct {
	ID             string            `gorm:"type:uuid;primaryKey" json:"id"`
	TareaProgramadaID string         `gorm:"not null" json:"tareaProgramadaId"`
	FechaEjecucion time.Time         `gorm:"autoCreateTime" json:"fechaEjecucion"`
	Estado         string            `gorm:"not null" json:"estado"` // "exitoso", "error", "ejecutando"
	DuracionMs     int64             `json:"duracionMs"`
	Resultado      datatypes.JSONMap `json:"resultado"`
	MensajeError   string            `json:"mensajeError"`
	Trigger        string            `json:"trigger"` // "programado", "manual"
}

func (EjecucionTarea) TableName() string {
	return "ejecuciones_tareas"
}