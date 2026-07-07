import { createContext, useContext } from "react";
import type { PlatformAdapter } from "./platforms";

export const PlatformContext = createContext<PlatformAdapter | null>(null);

export function usePlatform(): PlatformAdapter {
  const platform = useContext(PlatformContext);

  if (!platform) {
    throw new Error("PlatformAdapter missing");
  }

  return platform;
}