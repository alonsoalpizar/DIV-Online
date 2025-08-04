package models

import (
  "time"
)

type CanalProceso struct {
  ID            string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
  CanalID       string    `gorm:"type:uuid;not null" json:"canalId"`
  ProcesoID     string    `gorm:"type:uuid;not null" json:"procesoId"`
  Trigger       string    `gorm:"type:text;not null" json:"trigger"`
  FechaCreacion time.Time `gorm:"autoCreateTime" json:"fechaCreacion"`

  // Relaciones opcionales (extras)
  Canal   Canal   `gorm:"foreignKey:CanalID;references:ID" json:"canal,omitempty"`
  Proceso Proceso `gorm:"foreignKey:ProcesoID;references:ID" json:"proceso,omitempty"`
}
