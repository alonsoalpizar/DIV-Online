package models

import (
	"gorm.io/datatypes"
	"time"
)

type Servidor struct {
	ID            string            `gorm:"primaryKey" json:"id"`
	Codigo        string            `json:"codigo"`
	Nombre        string            `json:"nombre"`
	Tipo          string            `json:"tipo"`
	Host          string            `json:"host"`
	Puerto        int               `json:"puerto"`
	Usuario       string            `json:"usuario"`
	Clave         string            `json:"clave"`
	FechaCreacion time.Time         `json:"fechaCreacion"`
	Extras        datatypes.JSONMap `json:"extras"` // mapa en formato JSON
}

func (Servidor) TableName() string {
	return "servidores"
}
