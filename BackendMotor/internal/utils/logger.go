package utils

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type RegistroEjecucion struct {
	Timestamp     string                 `json:"timestamp"`
	ProcesoId     string                 `json:"procesoId"`
	NombreProceso string                 `json:"nombreProceso"`
	Canal         string                 `json:"canal"`
	TipoObjeto    string                 `json:"tipoObjeto"`
	NombreObjeto  string                 `json:"nombreObjeto"`
	Parametros    map[string]interface{} `json:"parametros"`
	Resultado     map[string]interface{} `json:"resultado"`
	FullOutput    map[string]interface{} `json:"fullOutput"`
	DuracionMs    int64                  `json:"duracion_ms"`
	Estado        string                 `json:"estado"`
	DetalleError  string                 `json:"detalleError,omitempty"`
	Asignaciones  map[string]interface{} `json:"asignaciones,omitempty"` // lo que se usó para invocar
	Salidas       map[string]interface{} `json:"salidas,omitempty"`      // lo que salió (del nodo salida)
}

func RegistrarEjecucionLog(registro RegistroEjecucion) error {
	fecha := time.Now().Format("20060102")
	logFileName := fmt.Sprintf("/opt/div/logs/ejecuciones_%s.log", fecha)

	os.MkdirAll(filepath.Dir(logFileName), os.ModePerm)

	file, err := os.OpenFile(logFileName, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer file.Close()

	jsonLog, err := json.Marshal(registro)
	if err != nil {
		return err
	}

	if _, err := file.WriteString(string(jsonLog) + "\n"); err != nil {
		return err
	}

	return nil
}
