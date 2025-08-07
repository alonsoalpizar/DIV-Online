package controllers

import (
	"backend/database"
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
)

// ConsecutivoResponse respuesta con el próximo código
type ConsecutivoResponse struct {
	ProximoCodigo string `json:"proximoCodigo"`
	Tipo          string `json:"tipo"`
}

// ObtenerProximoCodigoServidor obtiene el próximo código para servidores: SRV-001, SRV-002...
func ObtenerProximoCodigoServidor(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var servidores []models.Servidor
	database.DB.Select("codigo").Find(&servidores)

	proximoCodigo := calcularProximoCodigoConPrefijo("SRV", servidores, func(s models.Servidor) string { return s.Codigo })

	response := ConsecutivoResponse{
		ProximoCodigo: proximoCodigo,
		Tipo:          "servidor",
	}

	json.NewEncoder(w).Encode(response)
}

// ObtenerProximoCodigoProceso obtiene el próximo código para procesos: PROC-001, PROC-002...
func ObtenerProximoCodigoProceso(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var procesos []models.Proceso
	database.DB.Select("codigo").Find(&procesos)

	proximoCodigo := calcularProximoCodigoConPrefijo("PROC", procesos, func(p models.Proceso) string { return p.Codigo })

	response := ConsecutivoResponse{
		ProximoCodigo: proximoCodigo,
		Tipo:          "proceso",
	}

	json.NewEncoder(w).Encode(response)
}

// calcularProximoCodigoConPrefijo calcula el próximo código con formato PREFIJO-###
func calcularProximoCodigoConPrefijo[T any](prefijo string, items []T, getCodigo func(T) string) string {
	maxNumero := 0
	patron := regexp.MustCompile(fmt.Sprintf(`^%s-(\d+)$`, prefijo))

	for _, item := range items {
		codigo := getCodigo(item)
		matches := patron.FindStringSubmatch(strings.ToUpper(codigo))
		if len(matches) == 2 {
			if numero, err := strconv.Atoi(matches[1]); err == nil {
				if numero > maxNumero {
					maxNumero = numero
				}
			}
		}
	}

	// Formato con 3 dígitos: 001, 002, 003...
	return fmt.Sprintf("%s-%03d", prefijo, maxNumero+1)
}
