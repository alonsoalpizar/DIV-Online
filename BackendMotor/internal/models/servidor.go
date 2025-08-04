package models

import (
	"time"

	"gorm.io/datatypes"
)

type Servidor struct {
	ID            string            `gorm:"primaryKey" json:"id"` // Es text, no uuid
	Codigo        string            `json:"codigo"`
	Nombre        string            `json:"nombre"`
	Tipo          string            `json:"tipo"`
	Host          string            `json:"host"`
	Puerto        int64             `json:"puerto"`
	Usuario       string            `json:"usuario"`
	Clave         string            `json:"clave"`
	FechaCreacion time.Time         `json:"fechaCreacion"`
	Extras        datatypes.JSONMap `json:"extras"`
}

func (Servidor) TableName() string {
	return "servidores"
}
