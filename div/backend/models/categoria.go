package models

// Categoria - Clasificación para diferentes entidades del sistema
type Categoria struct {
	ID     string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Nombre string `json:"nombre" gorm:"not null"`
	Color  string `json:"color"`  // Color opcional para UI
	Activo bool   `json:"activo" gorm:"default:true"`
	Ambito string `json:"ambito" gorm:"not null;default:proceso"` // "proceso", "servidor", "canal", etc.
}