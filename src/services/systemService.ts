import { doc } from "firebase/firestore";
import { db } from "./_lib/firebase";
import { fetchDocWithCache } from "@/lib/cache";

export interface SystemSettings {
  acceptingApplications: boolean;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const defaultSettings: SystemSettings = {
    acceptingApplications: true, // Default if not found in db
  };

  try {
    const docRef = doc(db, "system", "settings");
    const docSnap = await fetchDocWithCache(docRef, "system_settings", 1000 * 60 * 60);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        acceptingApplications: data.acceptingApplications ?? true,
      };
    }
  } catch (error) {
    console.error("Error fetching system settings:", error);
  }

  return defaultSettings;
}
