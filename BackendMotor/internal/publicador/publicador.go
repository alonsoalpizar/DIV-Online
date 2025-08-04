// internal/publicador/publicador.go
package publicador

import (
	"backendmotor/internal/database"
	"context"
	"log"
	"time"
)

type MetodoExpuesto struct {
	Trigger    string
	ProcesoID  string
	TipoObjeto string // procedimiento, endpoint, etc (futuro uso)
}

type CanalPublicado struct {
	ID              string
	Codigo          string
	TipoPublicacion string
	TipoData        string // ✅ AGREGAR AQUÍ
	Metodos         map[string]MetodoExpuesto
}

var CanalesPublicados = make(map[string]CanalPublicado)

func PublicarCanales(ctx context.Context) error {
	db := database.DBGORM
	type canalDB struct {
		ID       string
		Codigo   string
		Tipo     string
		TipoData string
	}

	type metodoDB struct {
		CanalID   string
		ProcesoID string
		Trigger   string
	}

	var canales []canalDB
	if err := db.Raw(`SELECT id, codigo, tipo_publicacion as tipo, tipo_data  FROM canales`).Scan(&canales).Error; err != nil {
		return err
	}

	var metodos []metodoDB
	if err := db.Raw(`SELECT canal_id, proceso_id, trigger FROM canal_procesos`).Scan(&metodos).Error; err != nil {
		return err
	}

	tmp := make(map[string]CanalPublicado)
	for _, canal := range canales {
		tmp[canal.Codigo] = CanalPublicado{
			ID:              canal.ID,
			Codigo:          canal.Codigo,
			TipoPublicacion: canal.Tipo,
			TipoData:        canal.TipoData, // ✅ AGREGAR AQUÍ
			Metodos:         make(map[string]MetodoExpuesto),
		}
	}

	for _, m := range metodos {
		for k, v := range tmp {
			if v.ID == m.CanalID {
				v.Metodos[m.Trigger] = MetodoExpuesto{
					Trigger:   m.Trigger,
					ProcesoID: m.ProcesoID,
				}
				tmp[k] = v
				break
			}
		}
	}

	CanalesPublicados = tmp
	log.Printf("[Publicador] %d canales publicados (%s)", len(CanalesPublicados), time.Now().Format(time.RFC3339))
	return nil
}
