import EventEmitter2 from "eventemitter2";
import { createContext, useContext, useEffect, useState } from "react";

export default class Cluster extends EventEmitter2 {
  time: number = 0;
}

const ClusterContext = createContext<Cluster|null>(null);

export function useCluster() {
  return useContext(ClusterContext);
}

export function useTime() {
  const cluster = useCluster();
  const [time, setTime] = useState(Number.NaN);

  useEffect(() => {
    if (cluster) {
      const startFrameListener = cluster.on('startFrame', message => {
        setTime(message.time);
      }, { objectify: true });

      return () => { 
        if (!(startFrameListener instanceof Cluster)) {
          startFrameListener.off();
        } else {
          console.log("error");
        }
      }
    }
  }, [cluster]);

  return time;
}

// export function useTick(cb: (delta

export { ClusterContext }
