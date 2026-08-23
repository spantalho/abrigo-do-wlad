import { DogForm } from "../../components/DogForm";
import { addDog } from "../../services/dogs";
import type { DogProps } from "../../types/dogs";

export default function NewDog() {

  const handleCreate = async (finalData: Omit<DogProps, "id">) => {
    await addDog(finalData);
  };

  return (
    <DogForm
      title="Adicionar Novo Cachorro"
      buttonLabel="Cadastrar Cachorro"
      onSubmit={handleCreate}
    />
  );
}
