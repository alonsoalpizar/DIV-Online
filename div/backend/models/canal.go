package models

import (
	"time"

	"gorm.io/datatypes"
)

type Canal struct {
	ID              string            `gorm:"type:uuid;primaryKey" json:"id"`
	Codigo          string            `gorm:"uniqueIndex;not null" json:"codigo"`
	Nombre          string            `json:"nombre"`
	TipoPublicacion string            `json:"tipoPublicacion"`
	FechaCreacion   time.Time         `json:"fechaCreacion"`
	Puerto          string            `json:"puerto"`
	TipoData        string            `json:"tipoData"` // corregido: exportado + camelCase correcto
	Extras          datatypes.JSONMap `json:"extras"`
}

func (Canal) TableName() string {
	return "canales"
}
