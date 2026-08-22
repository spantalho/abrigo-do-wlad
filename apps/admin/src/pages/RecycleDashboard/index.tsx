import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MapPin, Pencil, Trash2, Map } from "lucide-react";
import { getRecyclePoints, deleteRecyclePoint } from "../../services/recycle";
import type { RecyclePoint } from "../../types/recycle";
import { DeleteModal } from "../../components/DeleteModal";
import { Pagination } from "../../components/Pagination";
import styles from "./RecycleDashboard.module.css";

const ITEMS_PER_PAGE = 8;

export default function RecycleDashboard() {
  const navigate = useNavigate();
  
  const [points, setPoints] = useState<RecyclePoint[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pointToDelete, setPointToDelete] = useState<{id: string, name: string} | null>(null);

  // Carregar dados
  async function loadData() {
    setLoading(true);
    const data = await getRecyclePoints();
    // Ordena alfabeticamente pela zona e depois pelo bairro
    setPoints(data.sort((a, b) => a.zone.localeCompare(b.zone) || a.neighborhood.localeCompare(b.neighborhood)));
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  // Filtragem
  const filteredPoints = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return points.filter(point => 
      point.neighborhood.toLowerCase().includes(term) ||
      point.zone.toLowerCase().includes(term) ||
      (point.name && point.name.toLowerCase().includes(term))
    );
  }, [points, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredPoints.length / ITEMS_PER_PAGE);
  const currentPoints = filteredPoints.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  function openDeleteModal(id: string, name: string) {
    setPointToDelete({ id, name });
  }

  async function confirmDelete() {
    if (!pointToDelete) return;
    try {
      await deleteRecyclePoint(pointToDelete.id);
      setPoints(prev => prev.filter(p => p.id !== pointToDelete.id));
      setPointToDelete(null);
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir ponto de coleta.");
    }
  }

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      
      {/* Top Bar: Busca e Botão Adicionar */}
      <div className={styles.topBar}>
        
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Buscar por zona, bairro ou nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.actionsRight}>
           <span className={styles.countBadge}>{filteredPoints.length} pontos</span>
           <button onClick={() => navigate("/admin/recycle/new")} className={styles.addButton}>
            <Plus size={20} /> Novo Ponto
          </button>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingState}>
          <p>Carregando pontos de coleta...</p>
        </div>
      )}

      {!loading && filteredPoints.length === 0 && (
        <div className={styles.emptyState}>
          <MapPin size={48} color="#d1d5db" />
          <p>
            {searchTerm 
              ? `Nenhum ponto encontrado para "${searchTerm}"` 
              : "Nenhum ponto de coleta cadastrado ainda."}
          </p>
          {!searchTerm && (
            <button onClick={() => navigate("/admin/recycle/new")}>Cadastre o primeiro</button>
          )}
        </div>
      )}

      {/* Lista de Pontos */}
      {!loading && currentPoints.length > 0 && (
        <>
          <div className={styles.listContainer}>
            {currentPoints.map((point) => (
              <div key={point.id} className={styles.pointCard}>
                <div className={styles.pointInfo}>
                  <div className={styles.pointHeader}>
                    <span className={styles.zoneBadge}>{point.zone}</span>
                    <h3 className={styles.pointNeighborhood}>{point.neighborhood}</h3>
                  </div>
                  {point.name && <p className={styles.pointName}><strong>{point.name}</strong></p>}
                  <p className={styles.pointAddress}>{point.address}</p>
                  
                  {/* Link pra testar as cordenadas */}
                  {point.latitude && point.longitude && (
                    <a 
                      href={`https://www.google.com/maps?q=${point.latitude},${point.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.mapLink}
                      title="Testar coordenadas no Google Maps"
                    >
                      <Map size={16} /> Ver no Mapa
                    </a>
                  )}
                </div>

                <div className={styles.pointActions}>
                  <button 
                    onClick={() => navigate(`/admin/recycle/edit/${point.id}`)} 
                    className={styles.actionBtn} 
                    title="Editar"
                  >
                    <Pencil size={18} /> Editar
                  </button>

                  <button 
                    onClick={() => openDeleteModal(point.id as string, point.name || point.neighborhood)}
                    className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </>
      )}

      <DeleteModal 
        isOpen={!!pointToDelete}
        onClose={() => setPointToDelete(null)}
        onConfirm={confirmDelete}
        dogName={pointToDelete?.name || "este ponto de coleta"} 
      />
    </div>
  );
}