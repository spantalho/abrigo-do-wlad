import { useState, useEffect } from "react";
import { getSystemSettings, type SystemSettings } from "@/services/systemService";

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await getSystemSettings();
        setSettings(data);
      } catch (error) {
        console.error("Failed to fetch system settings", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return { settings, loading };
}
