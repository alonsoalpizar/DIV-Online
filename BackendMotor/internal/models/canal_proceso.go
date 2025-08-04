package models

import (
	"time"
)

type CanalProceso struct {
	ID            string    `gorm:"type:uuid;primaryKey" json:"id"`
	CanalID       string    `gorm:"not null" json:"canalId"`
	ProcesoID     string    `gorm:"not null" json:"procesoId"`
	Trigger       string    `gorm:"not null" json:"trigger"`
	FechaCreacion time.Time `json:"fechaCreacion"`

	// Relaciones opcionales
	Canal   *Canal   `gorm:"foreignKey:CanalID" json:"canal,omitempty"`
	Proceso *Proceso `gorm:"foreignKey:ProcesoID" json:"proceso,omitempty"`
}

func (CanalProceso) TableName() string {
	return "canal_procesos"
}
