import { db } from "./_lib/firebase";
import { fetchWithCache } from "@/lib/cache";
import {
  collection,
  query
} from "firebase/firestore";
import type { RecyclePoint } from "../types/recycle";

const RECYCLE_COLLECTION = "recycle_points";

export async function getRecyclePoints(): Promise<RecyclePoint[]> {
  try {
    const q = query(collection(db, RECYCLE_COLLECTION));
    const querySnapshot = await fetchWithCache(q, "all_recycle_points");

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RecyclePoint[];
  } catch (error) {
    console.error("Erro ao buscar pontos de coleta:", error);
    return [];
  }
}