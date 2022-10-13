import { forwardRef, PropsWithChildren, PropsWithRef, Ref, startTransition, useEffect, useImperativeHandle, useLayoutEffect, useReducer, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera, Plane, RenderTexture, ScreenQuad, Sphere, TransformControls, useFBO} from '@react-three/drei';
import { BackSide, Camera, Color, ColorRepresentation, DoubleSide, Euler, Matrix3, Matrix4, Object3D, Scene, Texture, Vector3 } from 'three';
import { AppBar, Box, Button, createTheme, IconButton, ThemeProvider } from '@mui/material';
import { Settings as SettingsIcon, TextRotateUpTwoTone } from '@mui/icons-material';
import Cluster, { ClusterContext, useCluster } from "./Cluster";
import Config from "./Config";
import ViewportView from "./ViewportView";
import { MasterView } from "./MasterView";
import { FrameReadyMessage, ServerMessage } from "./Messages";
import SyncedCanvas from "./SyncedCanvas";

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
  const serverURI = searchParams.get("server");
  const viewport = searchParams.get("viewport");
  const debugViewportFrustum = searchParams.get("debugViewportFrustum");
  const initialViewerPosition = searchParams.get("initialViewerPosition");
  const [viewerPosition, setViewerPosition] = useState(() => parseInitialViewerPosition(initialViewerPosition));
  const [viewerOrientation, setViewerOrientation] = useState(() => new Matrix3());
  const [trackingUpdateRate, setTrackingUpdateRate] = useState<number|undefined>();
  const [ipd, setIPD] = useState(0.01);
  const [time, setTime] = useState(0);
  const [frame, setFrame] = useState<number|undefined>();
  const [cluster] = useState(() => new Cluster());

  useEffect(() => {
    if (!serverURI) {
      const timer = setInterval(() => setTime(time => time + 1/60), 1000/60);
      return () => clearInterval(timer);
    }
  }, [serverURI]);

  useEffect(() => {
    if (serverURI) {
      const realURI =
        serverURI.startsWith("ws://") || serverURI.startsWith("wss://")
        ? serverURI
        : `ws://${serverURI}`;

      const ws = new WebSocket(realURI);
      ws.onmessage = event => {
        const message = JSON.parse(event.data) as ServerMessage;
        cluster.emit(message.type, message);
      }

      const frameReadyListener = cluster.on('frameReady', message => {
        ws.send(JSON.stringify(message));
      }, { objectify: true });

      return () => {
        ws.close();
        if (!(frameReadyListener instanceof Cluster)) {
          frameReadyListener.off();
        }
      }
    }
  }, [serverURI]);

  return (
    <ClusterContext.Provider value={cluster}>
      {
      viewport
      ?
      <SyncedCanvas>
        <ViewportView
          viewport={props.config[viewport]}
          viewerPosition={viewerPosition}
        >
          {props.children}
        </ViewportView>
      </SyncedCanvas>
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
    </ClusterContext.Provider>
  );
}
