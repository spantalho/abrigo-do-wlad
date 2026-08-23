import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MapPin, Pencil, Trash2, Map } from "lucide-react";
import { Badge } from "@jaci/ui/Badge";
import { Button } from "@jaci/ui/Button";
import { Input } from "@jaci/ui/Field";
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
  useEffect(() => {
    let active = true;
    getRecyclePoints()
      .then((data) => {
        if (active) {
          setPoints(data.sort((a, b) => a.zone.localeCompare(b.zone) || a.neighborhood.localeCompare(b.neighborhood)));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

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
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Pontos de Coleta</h1>
        <p className={styles.subtitle}>
          Gerencie os locais que recebem tampinhas em apoio ao abrigo.
        </p>
      </header>

      <div className={styles.topBar}>

        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <Input
            type="text"
            aria-label="Buscar ponto de coleta"
            placeholder="Buscar por zona, bairro ou nome..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.actionsRight}>
           <Badge variant="outline">{filteredPoints.length} pontos</Badge>
           <Button onClick={() => navigate("/admin/recycle/new")} className={styles.addButton}>
            <Plus size={20} /> Novo Ponto
          </Button>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingState}>
          <p>Carregando pontos de coleta...</p>
        </div>
      )}

      {!loading && filteredPoints.length === 0 && (
        <div className={styles.emptyState}>
          <MapPin size={48} color="var(--border)" />
          <p>
            {searchTerm
              ? `Nenhum ponto encontrado para "${searchTerm}"`
              : "Nenhum ponto de coleta cadastrado ainda."}
          </p>
          {!searchTerm && (
            <Button variant="text" onClick={() => navigate("/admin/recycle/new")}>Cadastre o primeiro</Button>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/recycle/edit/${point.id}`)}
                    className={styles.actionBtn}
                    title="Editar"
                  >
                    <Pencil size={18} /> Editar
                  </Button>

                  <Button
                    variant="danger"
                    size="icon-sm"
                    aria-label={`Excluir ${point.name || point.neighborhood}`}
                    onClick={() => openDeleteModal(point.id as string, point.name || point.neighborhood)}
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </Button>
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
