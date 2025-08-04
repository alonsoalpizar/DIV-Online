package models

import (
	"time"
)

type Parametro struct {
	ID            string    `gorm:"primaryKey" json:"id"`
	Nombre        string    `json:"nombre"`
	Valor         string    `json:"valor"`
	Descripcion   string    `json:"descripcion"`
	FechaCreacion time.Time `json:"fechaCreacion"`
}

func (Parametro) TableName() string {
	return "parametros"
}
