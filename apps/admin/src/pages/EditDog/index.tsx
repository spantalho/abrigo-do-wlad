import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DogForm } from "../../components/DogForm";
import { getDogById, updateDog } from "../../services/dogs";
import type { DogProps } from "../../types/dogs";

export default function EditDog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dogData, setDogData] = useState<DogProps | null>(null);

  // Carrega os dados
  useEffect(() => {
    async function load() {
      if(!id) return;
      const data = await getDogById(Number(id));
      if (data) {
        setDogData(data);
      } else {
        alert("Cachorro não encontrado!");
        navigate("/admin");
      }
    }
    load();
  }, [id, navigate]);

  const handleUpdate = async (finalData: Omit<DogProps, "id">) => {
    await updateDog(Number(id), finalData);
  };

  if (!dogData) return <div className="container" style={{padding:'2rem'}}>Carregando...</div>;

  return (
    <DogForm 
      title={`Editar: ${dogData.nome}`}
      buttonLabel="Salvar Alterações"
      initialData={dogData}
      onSubmit={handleUpdate}
    />
  );
}
