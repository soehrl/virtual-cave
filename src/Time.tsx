import { createContext, useContext } from "react";

interface TimeContextType {
  time: number;
  // update: (deltaTime: number, time: number) => void;
}

const TimeContext = createContext<TimeContextType|null>(null);

export function useTime() {
  const timeContext = useContext(TimeContext);
  return timeContext ? timeContext.time : Number.NaN;
}

export { TimeContext }
