"use client";

import { ReactNode } from "react";
import { FarmProvider } from "@/contexts/FarmContext";

export default function DashboardProviders({ children }: { children: ReactNode }) {
  return <FarmProvider>{children}</FarmProvider>;
}
