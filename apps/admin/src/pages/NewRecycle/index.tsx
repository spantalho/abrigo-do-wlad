import { RecycleForm } from "../../components/RecycleForm";
import { addRecyclePoint } from "../../services/recycle";
import type { RecyclePointInput } from "../../types/recycle";

export default function NewRecycle() {
  const handleCreate = async (finalData: RecyclePointInput) => {
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
