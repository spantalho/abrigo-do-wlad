import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { RecycleForm } from "../../components/RecycleForm";
import { getRecyclePointById, updateRecyclePoint } from "../../services/recycle";
import type { RecyclePoint } from "../../types/recycle";

export default function EditRecycle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pointData, setPointData] = useState<RecyclePoint | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const data = await getRecyclePointById(id);
      if (data) {
        setPointData(data);
      } else {
        alert("Ponto de coleta não encontrado!");
        navigate("/admin/recycle");
      }
    }
    load();
  }, [id, navigate]);

  const handleUpdate = async (finalData: Omit<RecyclePoint, "id">) => {
    await updateRecyclePoint(id as string, finalData);
  };

  if (!pointData) return <div className="container" style={{padding:'2rem'}}>Carregando...</div>;

  return (
    <RecycleForm
      title={`Editar: ${pointData.neighborhood}`}
      buttonLabel="Salvar Alterações"
      initialData={pointData}
      onSubmit={handleUpdate}
    />
  );
}
