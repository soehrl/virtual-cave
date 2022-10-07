export interface TrackingBody {
  id: string;
  isTracked: boolean;
  position: [number, number, number];
  orientation: [number, number, number, number, number, number, number, number, number];
}

interface TrackingData {
  bodies: TrackingBody[];
}

export interface StartFrameMessage {
  type: "startFrame";
  frame: number;
  time: number;
  deltaTime: number;
  trackingData: TrackingData;
}

export interface DisplayFrameMessage {
  type: "displayFrame";
  frame: number;
}

export type ServerMessage = StartFrameMessage | DisplayFrameMessage;

export interface FrameReadyMessage {
  type: "frameReady";
  frame: number;
}

export type ClientMessage = FrameReadyMessage;
