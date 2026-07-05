import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Hydration-safe mount detection without setState-in-effect: the server
// snapshot is always false, the client snapshot is always true, so this
// flips exactly once on hydration without a synchronous effect render loop.
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
