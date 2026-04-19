import { useSyncExternalStore } from "react";
import { engine } from "@/data/engine";

export function useExecutionsStore() {
  return useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.list(),
    () => engine.list(),
  );
}
