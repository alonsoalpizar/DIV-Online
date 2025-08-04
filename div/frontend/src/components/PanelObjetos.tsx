import '../styles/panelObjetos.css';

const PanelObjetos = () => {
  const onDragStart = (event: React.DragEvent, tipo: string) => {
    event.dataTransfer.setData('application/reactflow', tipo);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="panel-objetos">
      <h4>📦 Objetos del Flujo</h4>
      <div
        className="nodo-item"
        onDragStart={event => onDragStart(event, 'entrada')}
        draggable
      >
        🟦 Entrada
      </div>
      <div
  className="nodo-item"
  onDragStart={event => onDragStart(event, 'splitter')}
  draggable
>
  ✂️ Splitter
</div>

      <div
        className="nodo-item"
        onDragStart={event => onDragStart(event, 'condicion')}
        draggable
      >
        ♦️ Condición
      </div>
      <div
        className="nodo-item"
        onDragStart={event => onDragStart(event, 'salida')}
        draggable
      >
        🟢 Salida
      </div>
     <div
  className="nodo-item"
  draggable
  onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'proceso')}
>
  🔵 Proceso
</div>
<div
       className="nodo-item"
        onDragStart={(event) => onDragStart(event, 'subproceso')}
        draggable
      >
        🔄 SubProceso
      </div>



<div
        className="nodo-item"
        onDragStart={e => e.dataTransfer.setData('application/reactflow', 'salidaError')}
        draggable
      >
        🔴 Salida Error
      </div>



    </aside>
  );
};

export default PanelObjetos;
