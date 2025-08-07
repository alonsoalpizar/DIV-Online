package models

import (
	"gorm.io/datatypes"
	"time"
)

type CampoTabla struct {
	Nombre string `json:"nombre"`
	Tipo   string `json:"tipo"`
}

type Tabla struct {
	ID            string         `json:"id" gorm:"primaryKey"`
	Nombre        string         `json:"nombre"`
	Campos        datatypes.JSON `json:"campos"` // Se guardará como JSON crudo
	Datos         datatypes.JSON `json:"datos"`  // Igual
	FechaCreacion time.Time      `json:"fechaCreacion"`
}
