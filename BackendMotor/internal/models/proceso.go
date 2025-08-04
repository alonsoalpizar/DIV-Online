package models

type Proceso struct {
	ID          string `gorm:"type:uuid;primaryKey" json:"id"`
	Codigo      string `gorm:"unique;not null" json:"codigo"`
	Nombre      string `gorm:"not null" json:"nombre"`
	Descripcion string `json:"descripcion"`
	Flujo       string `json:"flujo"` // JSON completo como string
}

func (Proceso) TableName() string {
	return "procesos"
}
