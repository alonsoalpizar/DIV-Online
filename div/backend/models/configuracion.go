package models

import (
	"time"
)

type Configuracion struct {
	ID             string    `gorm:"type:uuid;primaryKey" json:"id"`
	NombreProyecto string    `json:"nombreProyecto"`
	Descripcion    string    `json:"descripcion"`
	URLBase        string    `json:"urlBase"`
	FechaCreacion  time.Time `json:"fechaCreacion"`
}
