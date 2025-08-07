package models

type Proceso struct {
	ID          string `gorm:"type:uuid;primaryKey" json:"id"`
	Codigo      string `json:"codigo" gorm:"unique;not null"`
	Nombre      string `json:"nombre" gorm:"not null"`
	Descripcion string `json:"descripcion"`
	Flujo       string `json:"flujo" gorm:"type:text"`
}
