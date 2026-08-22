import { NavLink } from "react-router-dom";
import { LayoutDashboard, Dog, Recycle, ClipboardList } from "lucide-react";
import styles from "./AdminNav.module.css";

export function AdminNav() {
  return (
    <div className={styles.navContainer}>
      <div className={`container ${styles.navWrapper}`}>
        <NavLink 
          to="/admin" 
          end 
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <LayoutDashboard size={20} />
          <span>Visão Geral</span>
        </NavLink>

        <NavLink 
          to="/admin/dog" 
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <Dog size={20} />
          <span>Cachorros</span>
        </NavLink>
        
        <NavLink 
          to="/admin/recycle" 
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <Recycle size={20} />
          <span>Pontos de Coleta</span>
        </NavLink>

        <NavLink 
          to="/admin/adoptions" 
          className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}
        >
          <ClipboardList size={20} />
          <span>Solicitações</span>
        </NavLink>
      </div>
    </div>
  );
}