"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

export interface Farm {
  id: string;
  farm_name: string;
  role: string;
}

interface FarmContextType {
  farms: Farm[];
  currentFarm: Farm | null;
  setCurrentFarm: (farm: Farm) => void;
  isLoading: boolean;
  refreshFarms: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

const STORAGE_KEY = "malroda_current_farm_id";

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [currentFarm, setCurrentFarmState] = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFarms = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setFarms([]);
      setCurrentFarmState(null);
      setIsLoading(false);
      return;
    }

    // Fetch all farms the user is a member of
    const { data: memberships, error } = await supabase
      .from("malroda_farm_members")
      .select(`
        farm_id,
        role,
        malroda_farms (
          id,
          farm_name
        )
      `)
      .eq("user_id", user.id);

    if (error || !memberships) {
      console.error("Error fetching farms:", error);
      setIsLoading(false);
      return;
    }

    const farmList: Farm[] = memberships.map((m: any) => ({
      id: m.malroda_farms.id,
      farm_name: m.malroda_farms.farm_name,
      role: m.role,
    }));

    setFarms(farmList);

    // Restore previously selected farm from localStorage
    const storedFarmId = localStorage.getItem(STORAGE_KEY);
    const storedFarm = farmList.find((f) => f.id === storedFarmId);

    if (storedFarm) {
      setCurrentFarmState(storedFarm);
    } else if (farmList.length > 0) {
      // Default to first farm
      setCurrentFarmState(farmList[0]);
      localStorage.setItem(STORAGE_KEY, farmList[0].id);
    }

    setIsLoading(false);
  };

  const setCurrentFarm = (farm: Farm) => {
    setCurrentFarmState(farm);
    localStorage.setItem(STORAGE_KEY, farm.id);
  };

  const refreshFarms = async () => {
    setIsLoading(true);
    await fetchFarms();
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  return (
    <FarmContext.Provider
      value={{
        farms,
        currentFarm,
        setCurrentFarm,
        isLoading,
        refreshFarms,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (context === undefined) {
    throw new Error("useFarm must be used within a FarmProvider");
  }
  return context;
}
