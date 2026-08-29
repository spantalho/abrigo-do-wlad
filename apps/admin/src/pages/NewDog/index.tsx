import { DogForm } from "../../components/DogForm";
import { addDog } from "../../services/dogs";
import type { DogInput } from "../../types/dogs";

export default function NewDog() {

  const handleCreate = async (finalData: DogInput) => {
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
