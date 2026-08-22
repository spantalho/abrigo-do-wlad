import { useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck } from "lucide-react";
import { Badge } from "@abrigo/ui/Badge";
import { Button } from "@abrigo/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./Header.module.css";
import logoImg from "../../assets/logo.png";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContent}`}>
        
        {/* Lado Esquerdo: Logo e Título */}
        <div className={styles.brandArea} onClick={() => navigate("/admin")}>
          <img src={logoImg} alt="Logo Abrigo" className={styles.logo} />
          <div className={styles.divider}></div>
          <Badge
            className={styles.adminTag}
            leftIcon={<ShieldCheck size={18} />}
            size="sm"
          >
            Painel Admin
          </Badge>
        </div>

        {/* Lado Direito: Usuário e Logout */}
        <div className={styles.userArea}>
          <div className={styles.userInfo}>
            <span className={styles.welcomeLabel}>Olá,</span>
            <span className={styles.userName}>
              {user?.email || "Usuário"}
            </span>
          </div>

          <Button
            onClick={logout} 
            className={styles.logoutBtn} 
            size="icon"
            title="Sair do sistema"
            aria-label="Sair do sistema"
          >
            <LogOut size={20} />
          </Button>
        </div>

      </div>
    </header>
  );
}
