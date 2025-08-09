//Codigo original bueno ----

import { useParams, useNavigate } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
  Connection,
  MarkerType,
  EdgeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { useState, useCallback } from "react";

import PanelObjetos from "../components/PanelObjetos";
import EditorEntrada from "../editors/EditorEntrada";
import EditorCondicion from "../editors/EditorCondicion";
import EditorSalida from "../editors/EditorSalida";
import EditorProceso from "../editors/EditorProceso";
import EditorSubProceso from "../editors/EditorSubProceso";
import EditorSalidaError from "../editors/EditorSalidaError";
import EditorEdge from "../editors/EditorEdge";
import EditorSplitter from "../editors/EditorSplitter";

import useFlujo from "../hooks/useFlujo";
import NodoEntrada from "../nodos/NodoEntrada";
import NodoCondicion from "../nodos/NodoCondicion";
import NodoSalida from "../nodos/NodoSalida";
import NodoProceso from "../nodos/NodoProceso";
import NodoSalidaError from "../nodos/NodoSalidaError";
import NodoSubproceso from "../nodos/NodoSubproceso";
import NodoSplitter from "../nodos/NodoSplitter";
import { aplanarCampos } from "../utils/aplanarCampos";
import { validarFlujo } from "../utils/validarFlujo";
import type { Validacion } from "../utils/validarFlujo";

// --- Tipos ---
export interface Campo {
  nombre: string;
  tipo: string;
}

// --- Node Types para ReactFlow ---
const nodeTypes = {
  entrada: NodoEntrada,
  condicion: NodoCondicion,
  salida: NodoSalida,
  proceso: NodoProceso,
  salidaError: NodoSalidaError,
  subproceso: NodoSubproceso,
  splitter: NodoSplitter,
};

// --- Edges personalizados ---
const OrtogonalEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  selected,
}: EdgeProps) => {
  const { setEdges } = useReactFlow();
  const midX = sourceX;
  const midY = targetY;
  const path = `M ${sourceX},${sourceY} L ${midX},${midY} L ${targetX},${targetY}`;

  // Permite eliminar la conexión con click derecho
  const handleContextMenu = (event: React.MouseEvent<SVGPathElement>) => {
    event.preventDefault();
    if (confirm("¿Eliminar esta conexión?")) {
      setEdges((eds) => eds.filter((e) => e.id !== id));
    }
  };

  return (
    <g>
      {/* Área de interacción invisible pero gruesa */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
        onContextMenu={handleContextMenu}
        style={{ cursor: "pointer" }}
      />
      {/* Línea visible */}
      <path
        id={id}
        d={path}
        stroke={selected ? "#1d4ed8" : "#555"}
        strokeWidth={2}
        fill="none"
        markerEnd={markerEnd}
        style={{ pointerEvents: "none" }}
      />
    </g>
  );
};

const OrtogonalEdgeError = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  selected,
}: EdgeProps) => {
  const { setEdges } = useReactFlow();
  const midX = sourceX;
  const midY = targetY;
  const path = `M ${sourceX},${sourceY} L ${midX},${midY} L ${targetX},${targetY}`;

  const handleContextMenu = (event: React.MouseEvent<SVGPathElement>) => {
    event.preventDefault();
    if (confirm("¿Eliminar esta conexión de error?")) {
      setEdges((eds) => eds.filter((e) => e.id !== id));
    }
  };

  return (
    <g>
      <path
        d={path}
        stroke="transparent"
        strokeWidth={14}
        fill="none"
        onContextMenu={handleContextMenu}
        style={{ cursor: "pointer" }}
      />
      <path
        id={id}
        d={path}
        stroke={selected ? "darkred" : "red"}
        strokeWidth={2.5}
        strokeDasharray="5,5"
        fill="none"
        markerEnd={markerEnd}
        style={{ pointerEvents: "none" }}
      />
    </g>
  );
};

const edgeTypes = {
  default: OrtogonalEdge,
  error: OrtogonalEdgeError,
};

// --- Componente principal ---
const FlujoCanvasInner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project } = useReactFlow();
  const [nodoEditando, setNodoEditando] = useState<Node | null>(null);
  const [edgeEditando, setEdgeEditando] = useState<Edge | null>(null);
  const [erroresValidacion, setErroresValidacion] = useState<Validacion[] | null>(null);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    guardarFlujo,
    nombreProceso,
    setNodes,
    setEdges,
  } = useFlujo(id!);

  // Genera un label secuencial para cada tipo de nodo
  const generarLabelSecuencial = (tipo: string): string => {
    const existentes = nodes.filter((n) => n.type === tipo);
    const cantidad = existentes.length + 1;
    return `${tipo.charAt(0).toUpperCase() + tipo.slice(1)}${cantidad}`;
  };

  // Memoiza los campos disponibles para condición
  const obtenerCamposDisponiblesCondicion = useCallback((nodoCondicion: Node): Campo[] => {
    const edgesEntrada = edges.filter((e) => e.target === nodoCondicion.id);
    const nodosAnteriores = nodes.filter((n) =>
      edgesEntrada.some((e) => e.source === n.id)
    );
    const camposHeredados = nodosAnteriores.flatMap((n) => {
      const label = n.data?.label || n.id;
      const entradas = aplanarCampos(n.data?.parametrosEntrada || []);
      const salidas = aplanarCampos(n.data?.parametrosSalida || []);
      const errores = aplanarCampos(n.data?.parametrosError || []);
      const camposSimples = aplanarCampos(n.data?.campos || []);
      const todos = [...entradas, ...salidas, ...errores, ...camposSimples];
      return todos.map((c: any) => ({
        nombre: `${label}.${c.ruta}`,
        tipo: c.tipo,
      }));
    });
    return [...camposHeredados, { nombre: "resultado", tipo: "boolean" }];
  }, [nodes, edges]);

  // Maneja la conexión de nodos (edges)
 const handleConnect = (connection: Edge | Connection) => {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);
  console.log("🧩 handleConnect:", connection);

  // 🛑 Validaciones por tipo de nodo fuente y destino

  if (sourceNode?.type === "entrada") {
    if (connection.sourceHandle !== "right") {
      alert("❌ Nodo 'Entrada' solo permite salida por la derecha.");
      return;
    }

    const yaTieneSalida = edges.some(
      (e) => e.source === sourceNode.id && e.sourceHandle === "right"
    );

    if (yaTieneSalida) {
      alert("⚠️ El nodo 'Entrada' solo permite una conexión de salida.");
      return;
    }

    if (connection.target === sourceNode.id) {
      alert("❌ No se puede conectar a sí mismo.");
      return;
    }
  }

  if (targetNode?.type === "proceso") {
    const handlePermitido = ["leftA", "leftB"];
    if (!handlePermitido.includes(connection.targetHandle || "")) {
      alert("⚠️ Nodo 'Proceso' solo permite entradas por leftA y leftB.");
      return;
    }

    const entradasActuales = edges.filter(
      (e) =>
        e.target === targetNode.id &&
        handlePermitido.includes(e.targetHandle || "")
    );

    if (entradasActuales.length >= 2) {
      alert("⚠️ El nodo 'Proceso' ya tiene 2 entradas conectadas.");
      return;
    }

    if (connection.source === connection.target) {
      alert("❌ No se puede conectar un nodo a sí mismo.");
      return;
    }
  }

  if (sourceNode?.type === "proceso") {
    const tipoSalida = connection.sourceHandle;
    const conexionesSalidaMismoTipo = edges.filter(
      (e) => e.source === sourceNode.id && e.sourceHandle === tipoSalida
    );

    if (conexionesSalidaMismoTipo.length >= 1) {
      const mensaje =
        tipoSalida === "error"
          ? "❌ El nodo 'Proceso' ya tiene una salida de error conectada."
          : "❌ El nodo 'Proceso' ya tiene una salida principal conectada.";
      alert(mensaje);
      return;
    }
  }

  if (sourceNode?.type === "salida") {
    alert("❌ Nodo 'Salida' no permite tener salidas.");
    return;
  }

  if (sourceNode?.type === "salidaError") {
    alert("❌ Nodo 'SalidaError' no permite tener salidas.");
    return;
  }

  if (targetNode?.type === "subproceso") {
    const handlePermitido = ["leftA", "leftB"];
    if (!handlePermitido.includes(connection.targetHandle || "")) {
      alert("⚠️ Nodo 'Subproceso' solo permite entradas por los puntos Izquierdos.");
      return;
    }

    const entradasActuales = edges.filter(
      (e) =>
        e.target === targetNode.id &&
        handlePermitido.includes(e.targetHandle || "")
    );

    if (entradasActuales.length >= 2) {
      alert("⚠️ El nodo 'Subproceso' ya tiene 2 entradas conectadas.");
      return;
    }

    if (connection.source === connection.target) {
      alert("❌ No se puede conectar un nodo a sí mismo.");
      return;
    }
  }

  if (sourceNode?.type === "subproceso") {
    const tipoSalida = connection.sourceHandle;
    const conexionesSalidaMismoTipo = edges.filter(
      (e) => e.source === sourceNode.id && e.sourceHandle === tipoSalida
    );

    if (conexionesSalidaMismoTipo.length >= 1) {
      const mensaje =
        tipoSalida === "error"
          ? "❌ El nodo 'Subproceso' ya tiene una salida de error conectada."
          : "❌ El nodo 'Subproceso' ya tiene una salida principal conectada.";
      alert(mensaje);
      return;
    }
  }

  if (targetNode?.type === "condicion") {
    const entradasActuales = edges.filter((e) => e.target === targetNode.id);
    if (entradasActuales.length >= 1) {
      alert("⚠️ El nodo 'Condición' solo permite una entrada.");
      return;
    }

    if (connection.source === connection.target) {
      alert("❌ No se puede conectar un nodo a sí mismo.");
      return;
    }
  }

  if (sourceNode?.type === "condicion") {
    const tipoSalida = connection.sourceHandle;
    const conexionesMismoTipo = edges.filter(
      (e) => e.source === sourceNode.id && e.sourceHandle === tipoSalida
    );

    if (conexionesMismoTipo.length >= 1) {
      const mensaje =
        tipoSalida === "true"
          ? "❌ Ya existe una salida para 'true' desde este nodo."
          : "❌ Ya existe una salida para 'false' desde este nodo.";
      alert(mensaje);
      return;
    }
  }

  if (targetNode?.type === "splitter") {
    const entradas = edges.filter((e) => e.target === targetNode.id);
    if (entradas.length >= 1) {
      alert("⚠️ El nodo 'Splitter' solo permite una entrada.");
      return;
    }

    if (connection.source === connection.target) {
      alert("❌ No se puede conectar un nodo a sí mismo.");
      return;
    }
  }

  if (sourceNode?.type === "splitter") {
    const salidas = edges.filter((e) => e.source === sourceNode.id);
    if (salidas.length >= 1) {
      alert("❌ El nodo 'Splitter' ya tiene una salida conectada.");
      return;
    }
  }

  // ✅ Detección de línea de error según tipo de nodo y handle
  const esLineaErrorCondicion =
    sourceNode?.type === "condicion" && connection.sourceHandle === "false";
  const esLineaErrorProceso =
    sourceNode?.type === "proceso" && targetNode?.type === "salidaError";
  const esLineaErrorSubproceso =
    sourceNode?.type === "subproceso" && targetNode?.type === "salidaError";

  const isErrorLine =
  (sourceNode?.type === "proceso" && targetNode?.type === "salidaError") ||
  (sourceNode?.type === "condicion" && connection.sourceHandle === "false");
  
 

  // 🔄 Si se conecta a salidaError, asignar los campos de error automáticamente
  if ((esLineaErrorProceso || esLineaErrorSubproceso) && targetNode) {
    const errores = sourceNode?.data?.parametrosError || [];
    setNodes((nds) =>
      nds.map((n) =>
        n.id === targetNode.id
          ? {
              ...n,
              data: {
                ...n.data,
                campos: errores,
                parametrosEntrada: errores,
              },
            }
          : n
      )
    );
  }

  // 🔄 Si se conecta desde CONDICIÓN por "false", asignar campos de error al nodo destino
if (esLineaErrorCondicion && targetNode) {
  const erroresCondicion = sourceNode?.data?.parametrosError || [];
  setNodes((nds) =>
    nds.map((n) =>
      n.id === targetNode.id
        ? {
            ...n,
            data: {
              ...n.data,
              campos: erroresCondicion,
              parametrosEntrada: erroresCondicion,
            },
          }
        : n
    )
  );
}


  // ✅ Construcción del edge final
  const nuevoEdge: Edge = {
    ...connection,
    id: `edge-${+new Date()}`,
    type: isErrorLine ? "error" : "default",
    style: isErrorLine
      ? { stroke: "red", strokeWidth: 2 }
      : { stroke: "#999" },
    data: {
      esError: isErrorLine,
    },
    source: connection.source ?? "",
    target: connection.target ?? "",
    sourceHandle: connection.sourceHandle ?? undefined,
    targetHandle: connection.targetHandle ?? undefined,
  };

  setEdges((eds) => [...eds, nuevoEdge]);
};


  // Detectar si hay algún modal abierto
  const hayModalAbierto = nodoEditando || edgeEditando || erroresValidacion;

  // --- Render ---
  return (
    <div style={{ height: "100vh" }}>
      {/* Barra superior - Solo visible cuando no hay modales */}
      {!hayModalAbierto && (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: "10px", 
          display: 'flex', 
          gap: '10px', 
          alignItems: 'center',
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
          zIndex: 1000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>🧩 Diseñando Proceso: {nombreProceso}</h2>
          <button
            onClick={() => {
              const errores = validarFlujo(nodes, edges);
              if (errores.some(e => e.tipo === 'error')) {
                alert("❌ No se puede guardar. Hay errores en el flujo.");
                setErroresValidacion(errores);
                return;
              }
              if (errores.length > 0) {
                const continuar = confirm("⚠️ Existen advertencias. ¿Desea guardar de todas formas?");
                if (!continuar) {
                  setErroresValidacion(errores);
                  return;
                }
              }
              guardarFlujo();
            }}
          >
            💾 Guardar Flujo
          </button>
          <button onClick={() => setErroresValidacion(validarFlujo(nodes, edges))}>
            🔍 Validar Flujo
          </button>
          <button onClick={() => navigate("/procesos")}>⬅️ Salir</button>
        </div>
      )}

      {/* Panel lateral de objetos */}
      <PanelObjetos />

      {/* Canvas principal */}
      <div tabIndex={0} style={{ 
        height: "100vh", 
        outline: "none",
        paddingTop: hayModalAbierto ? "0px" : "70px" // Espacio dinámico según el topbar
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}          
          onNodeDoubleClick={(_, node) => setNodoEditando(node)}
          onEdgeDoubleClick={(_, edge) => setEdgeEditando(edge)}
          onDrop={(event) => {
            event.preventDefault();
            const tipo = event.dataTransfer.getData("application/reactflow");
            if (!tipo) return;
            if (['entrada', 'salida', 'salidaError'].includes(tipo)) {
              const yaExiste = nodes.some(n => n.type === tipo);
              if (yaExiste) {
                alert(`⚠️ Solo se permite un nodo de tipo "${tipo}" por flujo.`);
                return;
              }
            }

            const bounds = event.currentTarget.getBoundingClientRect();
            const position = project({
              x: event.clientX - bounds.left,
              y: event.clientY - bounds.top,
            });

            const id = `${tipo}-${+new Date()}`;
            let nuevoNodo: Node;

            // --- Tipos de nodos ---
            if (tipo === "subproceso") {
              nuevoNodo = {
                id,
                type: "subproceso",
                position,
                data: {
                  label: generarLabelSecuencial(tipo),
                  procesoId: "",
                  parametrosEntrada: [],
                  parametrosSalida: [],
                },
              };
            } else if (tipo === "proceso") {
              nuevoNodo = {
                id,
                type: "proceso",
                position,
                data: {
                  label: generarLabelSecuencial(tipo),
                  servidorId: "",
                  tipoObjeto: "",
                  objeto: "",
                  parametrosEntrada: [],
                  parametrosSalida: [],
                  parametrosError: [
                    { nombre: "codigoError", tipo: "string" },
                    { nombre: "mensajeError", tipo: "string" },
                    { nombre: "detalleError", tipo: "string" }
                  ],
                  asignaciones: {}
                }
              };
            } else if (tipo === "splitter") {
              nuevoNodo = {
                id,
                type: "splitter",
                position,
                data: {
                  label: generarLabelSecuencial(tipo),
                  modoOperacion: "descomponer",
                  campoEntrada: "",
                  campoSalida: "",
                  modoParseo: "delimitado",
                  delimitadorPrincipal: "|",
                  separadorClaveValor: "=",
                  segmentosFijos: [],
                  camposUnir: [],
                  parametrosEntrada: [],
                  parametrosSalida: [],
                }
              };
            } else {
              // Otros tipos
              nuevoNodo = {
                id,
                type: tipo,
                position,
                data: {
                  label: generarLabelSecuencial(tipo),
                  campos:
                    tipo === "salidaError"
                      ? [
                          { nombre: "codigoError", tipo: "string" },
                          { nombre: "mensajeError", tipo: "string" },
                          { nombre: "detalle", tipo: "string" },
                        ]
                      : [],
                  condicion: tipo === "condicion" ? "sinError" : undefined,
                  parametrosEntrada: [],
                  parametrosSalida: [],
                  asignaciones: {},
                },
              };
            }

            setNodes((nds) => [...nds, nuevoNodo]);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* Modales de edición de nodos */}
      {nodoEditando?.type === "entrada" && (
        <EditorEntrada
          label={nodoEditando.data.label}
          campos={nodoEditando.data.campos}
          onGuardar={(nuevoLabel, nuevosCampos, nuevosParametrosSalida) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodoEditando.id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        label: nuevoLabel,
                        campos: nuevosCampos,
                        parametrosSalida: nuevosParametrosSalida,
                      },
                    }
                  : n,
              ),
            );
            setNodoEditando(null);
          }}
          onCancelar={() => setNodoEditando(null)}
        />
      )}

{nodoEditando?.type === "condicion" && (
  <div>
    <div>
      <EditorCondicion
        label={nodoEditando.data.label}
        condicion={nodoEditando.data.condicion || ""}
        parametrosEntrada={nodoEditando.data.parametrosEntrada || []}
        onGuardar={(nuevoData) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodoEditando.id
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      ...nuevoData,
                    },
                  }
                : n
            )
          );
          setNodoEditando(null);
        }}
        onCancelar={() => setNodoEditando(null)}
      />
    </div>
  </div>
)}




      {nodoEditando?.type === 'salida' && (
        <EditorSalida
          label={nodoEditando.data.label}
          campos={nodoEditando.data.campos || []}
          formatoSalida={nodoEditando.data.formatoSalida || 'json'}
          tagPadre={nodoEditando.data.tagPadre || ''}
          onGuardar={(nuevoLabel, nuevosCampos, nuevoFormato, nuevoTagPadre) => {
            setNodes(nds =>
              nds.map(n =>
                n.id === nodoEditando.id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        label: nuevoLabel,
                        campos: nuevosCampos,
                        parametrosEntrada: nuevosCampos.map(({ nombre, tipo }: Campo) => ({ nombre, tipo })),
                        formatoSalida: nuevoFormato,
                        tagPadre: nuevoTagPadre
                      }
                    }
                  : n
              )
            );
            setNodoEditando(null);
          }}
          onCancelar={() => setNodoEditando(null)}
        />
      )}

      {nodoEditando?.type === "salidaError" && (
        <EditorSalidaError
          label={nodoEditando.data.label}
          nodoId={nodoEditando.id}
          edges={edges}
          campos={nodoEditando.data.campos}
          onGuardar={(nuevoLabel, nuevosCampos) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodoEditando.id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        label: nuevoLabel,
                        campos: nuevosCampos,
                        parametrosEntrada: nuevosCampos.map((c: Campo) => ({ nombre: c.nombre, tipo: c.tipo }))
                      },
                    }
                  : n,
              ),
            );
            setNodoEditando(null);
          }}
          onCancelar={() => setNodoEditando(null)}
        />
      )}

      {nodoEditando?.type === "proceso" && (
        <EditorProceso
          nodoId={nodoEditando.id}
          edges={edges}
          label={nodoEditando.data.label}
          servidorId={nodoEditando.data.servidorId || ""}
          tipoObjeto={nodoEditando.data.tipoObjeto || "sp"}
          objeto={nodoEditando.data.objeto || ""}
          parametrosEntrada={nodoEditando.data.parametrosEntrada || []}
          parametrosSalida={nodoEditando.data.parametrosSalida || []}
          parametrosError={nodoEditando.data.parametrosError || []}
          tagPadre={nodoEditando.data.tagPadre || ''}
          parsearFullOutput={nodoEditando.data.parsearFullOutput || false}
          tipoRespuesta={nodoEditando.data.tipoRespuesta || 'json'}
          fullOutput={nodoEditando.data.fullOutput || ''}
          onGuardar={(
            nuevoLabel,
            nuevoServidor,
            nuevoTipo,
            nuevoObjeto,
            entrada,
            salida,
            errores,
            metodoHttp,
            nuevoTagPadre,
            nuevoParsearFullOutput,
            nuevoTipoRespuesta,
            nuevoFullOutput
          ) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodoEditando.id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        label: nuevoLabel,
                        servidorId: nuevoServidor,
                        tipoObjeto: nuevoTipo,
                        objeto: nuevoObjeto,
                        parametrosEntrada: entrada,
                        parametrosSalida: salida,
                        parametrosError: errores,
                        tagPadre: nuevoTagPadre,
                        parsearFullOutput: nuevoParsearFullOutput,
                        tipoRespuesta: nuevoTipoRespuesta,
                        fullOutput: nuevoFullOutput
                      }
                    }
                  : n
              )
            );
            setNodoEditando(null);
          }}
          onCancelar={() => setNodoEditando(null)}
        />
      )}

      {nodoEditando?.type === "splitter" && (
        <EditorSplitter
          label={nodoEditando.data.label}
          modoOperacion={nodoEditando.data.modoOperacion}
          campoEntrada={nodoEditando.data.campoEntrada}
          campoSalida={nodoEditando.data.campoSalida}
          modoParseo={nodoEditando.data.modoParseo}
          delimitadorPrincipal={nodoEditando.data.delimitadorPrincipal}
          separadorClaveValor={nodoEditando.data.separadorClaveValor}
          segmentosFijos={nodoEditando.data.segmentosFijos || []}
          camposUnir={nodoEditando.data.camposUnir || []}
          parametrosEntrada={nodoEditando.data.parametrosEntrada || []}
          parametrosSalida={nodoEditando.data.parametrosSalida || []}
          longitudRegistro={nodoEditando.data.longitudRegistro}
          campoMultiple={nodoEditando.data.campoMultiple}
          codificacion={nodoEditando.data.codificacion}
          prefijo={nodoEditando.data.prefijo}
          sufijo={nodoEditando.data.sufijo}
          onGuardar={(nuevoLabel, modo, entrada, salida, modoParseo, delim, sep, segmentos, campos, entradaCampos, salidaCampos, codificacion, prefijo, sufijo, longitudRegistro, campoMultiple) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodoEditando.id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        label: nuevoLabel,
                        modoOperacion: modo,
                        campoEntrada: entrada,
                        campoSalida: salida,
                        modoParseo,
                        delimitadorPrincipal: delim,
                        separadorClaveValor: sep,
                        segmentosFijos: segmentos,
                        camposUnir: campos,
                        parametrosEntrada: entradaCampos,
                        parametrosSalida: modo === 'descomponer'
                          ? salidaCampos
                          : [{ nombre: salida, tipo: 'string' }],
                        codificacion: codificacion,
                        prefijo: prefijo,
                        sufijo: sufijo,
                        longitudRegistro: longitudRegistro,
                        campoMultiple: campoMultiple
                      }
                    }
                  : n
              )
            );
            setNodoEditando(null);
          }}
          onCancelar={() => setNodoEditando(null)}
        />
      )}

      {nodoEditando?.type === "subproceso" && (
        <EditorSubProceso
          label={nodoEditando.data.label}
          procesoId={nodoEditando.data.procesoId || ""}
          parametrosEntrada={nodoEditando.data.parametrosEntrada || []}
          parametrosSalida={nodoEditando.data.parametrosSalida || []}
          onGuardar={(
            nuevoLabel,
            procesoId,
            entrada,
            salida,
            procesoNombre,
          ) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodoEditando.id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        label: nuevoLabel,
                        procesoId,
                        procesoNombre,
                        parametrosEntrada: entrada,
                        parametrosSalida: salida,
                      },
                    }
                  : n,
              ),
            );
            setNodoEditando(null);
          }}
          onCancelar={() => setNodoEditando(null)}
        />
      )}

      {/* Modal para asignaciones de edge */}
      {edgeEditando &&
        (() => {
          const sourceId = edgeEditando.source;
          const targetId = edgeEditando.target;
          const nodoDestino = nodes.find((n) => n.id === targetId);

          if (!sourceId || !targetId || !nodoDestino) return null;

          return (
            <EditorEdge
              edge={edgeEditando}
              onGuardar={(edgeId, nuevasAsignaciones) => {
                setNodes((nds) =>
                  nds.map((n) =>
                    n.id === targetId
                      ? {
                          ...n,
                          data: {
                            ...n.data,
                            asignaciones: {
                              ...(n.data?.asignaciones || {}),
                              [sourceId]: nuevasAsignaciones,
                            },
                          },
                        }
                      : n,
                  ),
                );
                setEdgeEditando(null);
              }}
              onClose={() => setEdgeEditando(null)}
            />
          );
        })()}

      {/* Modal de validación */}
      {erroresValidacion && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: 20, borderRadius: 8,
            maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 0 10px rgba(0,0,0,0.4)'
          }}>
            <h3>🧪 Resultados de Validación del Flujo</h3>
            {erroresValidacion.length === 0 ? (
              <p>✅ Flujo válido. No se encontraron errores.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {erroresValidacion.map((e, i) => (
                  <li key={i} style={{ marginBottom: 8, color: e.tipo === 'error' ? 'red' : '#b58900' }}>
                    {e.tipo === 'error' ? '❌' : '⚠️'} [{e.nodoId}] {e.mensaje}
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setErroresValidacion(null)} style={{ marginTop: 20 }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Wrapper con ReactFlowProvider ---
const FlujoCanvas = () => (
  <ReactFlowProvider>
    <FlujoCanvasInner />
  </ReactFlowProvider>
);

export default FlujoCanvas;