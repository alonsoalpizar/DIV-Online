package models

import (
	"time"

	"gorm.io/datatypes"
)

type Tabla struct {
	ID            string                 `gorm:"primaryKey" json:"id"`
	Nombre        string                 `json:"nombre"`
	Campos        datatypes.JSON         `json:"campos"` // Cambiado para aceptar cualquier JSON
	Datos         datatypes.JSON         `json:"datos"`  // Cambiado para aceptar cualquier JSON  
	FechaCreacion time.Time              `json:"fechaCreacion"`
}

func (Tabla) TableName() string {
	return "tablas"
}
