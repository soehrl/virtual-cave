import EventEmitter2 from "eventemitter2";
import { createContext, useContext } from "react";

export default class Cluster extends EventEmitter2 {
  time: number = 0;
}

// interface ClusterSyncContextType extends EventEmitter2 {
//   time: number;
//   // onStartFrame: EventEmitter2<
//   // onDisplayFrame: () => void;
//   // update: (deltaTime: number, time: number) => void;
// }

const ClusterContext = createContext<Cluster|null>(null);

export function useCluster() {
  return useContext(ClusterContext);
}

export function useTime() {
  const cluster = useCluster();
  return cluster ? cluster.time : Number.NaN;
}

export { ClusterContext }
