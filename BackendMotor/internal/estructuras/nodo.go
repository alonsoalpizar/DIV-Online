package estructuras

type Posicion struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type NodoGenerico struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`
	Data      map[string]interface{} `json:"data"`
	Position  Posicion               `json:"position"`
	ProcesoID string                 `json:"procesoId"` // 🆕 necesario para persistencia
}
type EdgeGenerico struct {
	ID           string                 `json:"id"`
	Source       string                 `json:"source"`
	Target       string                 `json:"target"`
	SourceHandle string                 `json:"sourceHandle,omitempty"`
	TargetHandle string                 `json:"targetHandle,omitempty"`
	Type         string                 `json:"type"`
	Data         map[string]interface{} `json:"data,omitempty"`
}

type Flujo struct {
	ID     string         `json:"id"`
	Nombre string         `json:"nombre"`
	Nodes  []NodoGenerico `json:"nodes"`
	Edges  []EdgeGenerico `json:"edges"`
}
