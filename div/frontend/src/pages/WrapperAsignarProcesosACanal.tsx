// src/pages/WrapperAsignarProcesosACanal.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AsignarProcesosACanal from "../components/AsignarProcesosACanal";
import { Canal } from "../types/canal"; // Asegurate que exista este tipo

const WrapperAsignarProcesosACanal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [canal, setCanal] = useState<Canal | null>(null);

  useEffect(() => {
    fetch(`http://localhost:30000/canales/${id}`)
      .then(res => res.json())
      .then(data => setCanal(data))
      .catch(err => {
        console.error("Error al cargar canal", err);
        navigate("/canales"); // redirigir si hay error
      });
  }, [id]);

  if (!canal) return <p>Cargando canal...</p>;

  return (
    <AsignarProcesosACanal
      canal={canal}
      onCancelar={() => navigate("/canales")}
    />
  );
};

export default WrapperAsignarProcesosACanal;
