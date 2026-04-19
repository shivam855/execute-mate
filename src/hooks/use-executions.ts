import { useSyncExternalStore } from "react";
import { engine } from "@/data/engine";
import type { Execution } from "@/data/mock";

let cache: Execution[] = engine.list();
let version = 0;
const listeners = new Set<() => void>();

engine.subscribe(() => {
  cache = engine.list();
  version++;
  listeners.forEach((l) => l());
});

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => cache;

export function useExecutionsStore() {
  // version referenced to keep tree-shake happy
  void version;
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
