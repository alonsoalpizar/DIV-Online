import { useCallback, useEffect, useState } from 'react';
import { getApiBase } from '../utils/configuracion';

import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection
} from 'reactflow';
import axios from 'axios';

// 🧼 Limpieza del flujo antes de guardar
const limpiarFlujo = (nodes: Node[], edges: Edge[]) => {
  const nodosLimpios = nodes.map(n => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data
  }));

  const conexionesLimpias = edges.map(e => ({
  id: e.id,
  source: e.source,
  target: e.target,
  type: e.type,
  data: e.data,
  sourceHandle: e.sourceHandle || null,
  targetHandle: e.targetHandle || null
}));


  return {
    nodes: nodosLimpios,
    edges: conexionesLimpias
  };
};


export default function useFlujo(procesoId: string) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nombreProceso, setNombreProceso] = useState('');
  const [procesoCompleto, setProcesoCompleto] = useState<any>(null);

  const cargar = async () => {
    try {
      const res = await axios.get(`${getApiBase()}/procesos`);
      const proceso = res.data.find((p: any) => p.id === procesoId);

      if (proceso) {
        setNombreProceso(proceso.nombre);
        setProcesoCompleto(proceso);

        if (proceso.flujo) {
          const flujo = JSON.parse(proceso.flujo);

          const nodesConAsignaciones = (flujo.nodes || []).map((n: any) => ({
            ...n,
            data: {
              ...n.data,
              asignaciones: n.data?.asignaciones || {}
            }
          }));

          setNodes(nodesConAsignaciones);
          setEdges(flujo.edges || []);
        }
      }
    } catch (error) {
      console.error('❌ Error al cargar flujo:', error);
    }
  };

  const guardarFlujo = async () => {
    const flujo = {
  ...limpiarFlujo(nodes, edges),
  id: procesoId,
  nombre: nombreProceso,
  // ...otros datos si hay
};


    console.log('💾 Guardando flujo completo con asignaciones:', flujo);

    try {
      await axios.put(`${getApiBase()}/procesos/${procesoId}`, {
        ...procesoCompleto,
        flujo: JSON.stringify(flujo)
      });

      alert('✅ Flujo guardado correctamente');
    } catch (error) {
      console.error('❌ Error al guardar flujo:', error);
      alert('Error al guardar el flujo');
    }
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(nds => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(eds => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges(eds => addEdge(connection, eds)),
    []
  );

  useEffect(() => {
    cargar();
  }, [procesoId]);

  return {
    nodes,
    edges,
    nombreProceso,
    onNodesChange,
    onEdgesChange,
    onConnect,
    guardarFlujo,
    setNodes,
    setEdges
  };
}
