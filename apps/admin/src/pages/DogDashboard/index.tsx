import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Dog, Search } from "lucide-react";
import { getDogs, removeDogAndTrack } from "../../services/dogs"; 
import { DogCard } from "../../components/DogCard";
import { AdoptionModal } from "../../components/AdoptionModal"; 
import { SuccessModal } from "../../components/SuccessModal"; 
import { Pagination } from "../../components/Pagination";
import type { DogProps } from "../../types/dogs";
import styles from "./DogDashboard.module.css";

const ITEMS_PER_PAGE = 9; // Cachorros por página

export default function DogDashboard() {
  const navigate = useNavigate();
  
  const [dogs, setDogs] = useState<DogProps[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dogToProcess, setDogToProcess] = useState<{id: number, nome: string} | null>(null);

  // Controla a exibicão do SuccessModal
  const [successInfo, setSuccessInfo] = useState<{isOpen: boolean, title: string, message: string}>({
    isOpen: false,
    title: "",
    message: ""
  });

  async function loadData() {
    setLoading(true);
    const data = await getDogs();
    setDogs(data.sort((a, b) => b.id - a.id));
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const filteredDogs = useMemo(() => {
    return dogs.filter(dog => 
      dog.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dogs, searchTerm]);

  const totalPages = Math.ceil(filteredDogs.length / ITEMS_PER_PAGE);
  const currentDogs = filteredDogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  function openAdoptionModal(id: number, nome: string) {
    setDogToProcess({ id, nome });
  }

  async function confirmRemoval(adoptedViaSite: boolean) {
    if (!dogToProcess) return;
    try {
      await removeDogAndTrack(dogToProcess.id, adoptedViaSite);
      
      setDogs(prev => prev.filter(dog => dog.id !== dogToProcess.id));
      
      setDogToProcess(null);

      if (adoptedViaSite) {
        setSuccessInfo({
          isOpen: true,
          title: "Adoção Registrada!",
          message: "O animal foi removido da lista do abrigo com sucesso."
        });
      } else {
        setSuccessInfo({
          isOpen: true,
          title: "Animal Removido",
          message: "O animal foi removido da lista do abrigo com sucesso."
        });
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao finalizar jornada do animal.");
    }
  }

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      
      <div className={styles.topBar}>
        
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.actionsRight}>
           <span className={styles.countBadge}>{filteredDogs.length} cães</span>
           <button onClick={() => navigate("/admin/dog/new")} className={styles.addButton}>
            <Plus size={20} /> Novo
          </button>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingState}>
          <p>Carregando cachorros...</p>
        </div>
      )}

      {!loading && filteredDogs.length === 0 && (
        <div className={styles.emptyState}>
          <Dog size={48} color="#d1d5db" />
          <p>
            {searchTerm 
              ? `Nenhum cachorro encontrado para "${searchTerm}"` 
              : "Nenhum cachorro cadastrado ainda."}
          </p>
          {!searchTerm && (
            <button onClick={() => navigate("/admin/new")}>Cadastre o primeiro</button>
          )}
        </div>
      )}

      {!loading && currentDogs.length > 0 && (
        <>
          <div className={styles.grid}>
            {currentDogs.map((dog) => (
              <DogCard 
                key={dog.id} 
                dog={dog} 
                onDelete={openAdoptionModal}
              />
            ))}
          </div>

          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </>
      )}

      <AdoptionModal 
        isOpen={!!dogToProcess}
        onClose={() => setDogToProcess(null)}
        onConfirm={confirmRemoval}
        dogName={dogToProcess?.nome || ""}
      />

      <SuccessModal
        isOpen={successInfo.isOpen}
        onClose={() => setSuccessInfo(prev => ({ ...prev, isOpen: false }))}
        title={successInfo.title}
        message={successInfo.message}
      />
    </div>
  );
}