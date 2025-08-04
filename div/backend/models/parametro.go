package models

import (
	"time"
)

type Parametro struct {
	ID          string    `gorm:"type:uuid;primaryKey" json:"id"`
	Nombre      string    `gorm:"not null" json:"nombre"`
	Valor       string    `gorm:"not null" json:"valor"`
	Descripcion string    `json:"descripcion"`
	FechaCreacion time.Time `json:"fechaCreacion"` // opcional: para trazabilidad
}
