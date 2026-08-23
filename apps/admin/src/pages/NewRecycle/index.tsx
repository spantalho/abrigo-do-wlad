import { RecycleForm } from "../../components/RecycleForm";
import { addRecyclePoint } from "../../services/recycle";
import type { RecyclePoint } from "../../types/recycle";

export default function NewRecycle() {
  const handleCreate = async (finalData: Omit<RecyclePoint, "id">) => {
    await addRecyclePoint(finalData);
  };

  return (
    <RecycleForm
      title="Adicionar Novo Ponto"
      buttonLabel="Cadastrar Ponto"
      onSubmit={handleCreate}
    />
  );
}
