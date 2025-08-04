package models

import (
	"time"

	"gorm.io/datatypes"
)

type Tabla struct {
	ID            string            `gorm:"primaryKey" json:"id"`
	Nombre        string            `json:"nombre"`
	Campos        datatypes.JSONMap `json:"campos"`
	Datos         datatypes.JSONMap `json:"datos"`
	FechaCreacion time.Time         `json:"fechaCreacion"`
}

func (Tabla) TableName() string {
	return "tablas"
}
