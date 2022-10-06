import { PropsWithChildren, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Plane, RenderTexture, Sphere, TransformControls} from '@react-three/drei';
import { BackSide, Camera, ColorRepresentation, DoubleSide, Euler, Matrix3, Matrix4, Object3D, Vector3 } from 'three';
import { AppBar, Box, Button, createTheme, IconButton, ThemeProvider } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { TimeContext } from "./Time";
import Config from "./Config";
import ViewportView from "./ViewportView";
import { MasterView } from "./MasterView";

interface Body {
  id: string;
  loc?: [number, number, number];
  rot?: [number, number, number, number, number, number, number, number, number];
}

interface Data {
  frame: number;
  time: number;
  bodies: Body[];
};



function parseInitialViewerPosition(str?: string|null) {
  const initialViewerPosition = new Vector3(0, 0, 0);
  if (str) {
    try {
      const positionArray = JSON.parse(str);
      if (Array.isArray(positionArray)) {
        for (let i = 0; i < 3; ++i) {
          if (positionArray.length > i && typeof positionArray[i] === 'number') {
            initialViewerPosition.setComponent(i, positionArray[i]);
          }
        }
      }
    } catch (error) {
    }
  }
  return initialViewerPosition;
}

export interface CaveProps extends PropsWithChildren {
  config: Config;
}

export default function Cave(props: CaveProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const dtrackURI = searchParams.get("dtrack");
  const viewport = searchParams.get("viewport");
  const debugViewportFrustum = searchParams.get("debugViewportFrustum");
  const initialViewerPosition = searchParams.get("initialViewerPosition");
  const [viewerPosition, setViewerPosition] = useState(() => parseInitialViewerPosition(initialViewerPosition));
  const [viewerOrientation, setViewerOrientation] = useState(() => new Matrix3());
  const [trackingUpdateRate, setTrackingUpdateRate] = useState<number|undefined>();
  const [ipd, setIPD] = useState(0.01);
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!dtrackURI) {
      const timer = setInterval(() => setTime(time => time + 1/60), 1000/60);
      return () => clearInterval(timer);
    }
  }, [dtrackURI]);

  useEffect(() => {
    if (dtrackURI) {
      const realURI =
        dtrackURI.startsWith("ws://") || dtrackURI.startsWith("wss://")
        ? dtrackURI
        : `ws://${dtrackURI}`;
      const ws = new WebSocket(realURI);

      let trackingUpdateCount = 0;
      const trackingRateUpdateRateInterval = 250;

      ws.onmessage = event => {
        setTime(time => time + 1/60);
        ++trackingUpdateCount;

        const d = JSON.parse(event.data) as Data;
        if (d.bodies.length > 0) {
          if (d.bodies[0].loc) {
            setViewerPosition(new Vector3(...d.bodies[0].loc).divideScalar(1000));
          }
          if (d.bodies[0].rot) {
            setViewerOrientation(new Matrix3().set(...d.bodies[0].rot).transpose());
          }
        }
      }

      const timer = setInterval(() => {
        setTrackingUpdateRate(trackingUpdateCount / (trackingRateUpdateRateInterval / 1000));
        trackingUpdateCount = 0;
      }, trackingRateUpdateRateInterval);

      return () => {
        ws.close();
        clearInterval(timer);
      }
    }
  }, [dtrackURI]);

  return (
    <TimeContext.Provider value={{ time }}>
      {
      viewport
      ?
      <Canvas>
        <ViewportView
          viewport={props.config[viewport]}
          viewerPosition={viewerPosition}
        >
          {props.children}
        </ViewportView>
      </Canvas>
      : 
      <MasterView
        config={props.config}
        viewerPosition={viewerPosition}
        debugViewportFrustum={debugViewportFrustum || undefined}
        viewerOrientation={viewerOrientation}
        ipd={ipd}
      >
        {props.children}
      </MasterView>
      }
    </TimeContext.Provider>
  );
}
