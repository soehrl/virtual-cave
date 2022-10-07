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

interface SyncedViewportProps extends PropsWithChildren {
  frame?: number;
  frameRendered?: (frame: number) => void;
}

const SyncedViewport = forwardRef((props: SyncedViewportProps, ref) => {
  const { scene, camera, gl } = useThree();

  const fbo = useFBO();
  const cluster = useCluster();

  useEffect(() => {
    if (cluster) {
      const startFrameListener = cluster.on('startFrame', message => {
        console.log(`Rendering frame ${message.frame}`);
        const t0 = performance.now();
        // console.log(clearColor);
        // gl.setClearColor(clearColor);
        gl.setRenderTarget(fbo);
        // gl.clear(true, false, false);
        gl.render(scene, camera);
        gl.setRenderTarget(null);
        const t1 = performance.now();
        // console.log(`Time: ${t1 - t0}ms`);
        const px = new Uint8Array(4);
        gl.readRenderTargetPixels(fbo, 0, 0, 1, 1, px);
        const t2 = performance.now();
        // console.log(`Time: ${t2 - t0}ms`);
        // console.log(scene.toJSON());
        cluster.emit('frameReady', JSON.stringify({
          type: 'frameReady',
          frame: message.frame,
        }));
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

  // useLayoutEffect(() => {
  // }, [gl, scene, camera, props.frame]);

  useImperativeHandle(ref, () => fbo.texture, [fbo]);

  // useFrame((state, delta) => {
  //   console.log(texture);
  // }, 10000);

  return (
    <>
      {props.children}
    </>
  );
});

interface ViewportCanvasProps extends PropsWithChildren {
  frame?: number;
  frameRendered?: (frame: number) => void;
}

function ViewportCanvas(props: ViewportCanvasProps) {
  const [scene] = useState(() => new Scene())
  const texture = useRef<Texture>();

  return (
    <Canvas
    >
      {
        createPortal(
          <SyncedViewport
            ref={texture}
            frame={props.frame}
          >
            {props.children}
          </SyncedViewport>,
          scene
        )
      }
      {/*
      <OrthographicCamera
        makeDefault
        args={[-1, 1, 1, -1, -1, 1]}
      />
      */}
      <Plane args={[2, 2, 1, 1]}>
        <meshToonMaterial>
          {
            texture.current ? <primitive object={texture.current} attach="map" /> : null
          }
        </meshToonMaterial>
      </Plane>
      <ambientLight />
    </Canvas>
  );
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
        // switch (message.type) {
        //   case "startFrame":
        //     setTime(message.time);
        //     setFrame(message.frame);
        //     // const response: FrameReadyMessage = {
        //     //   type: "frameReady",
        //     //   frame: message.frame,
        //     // };
        //     // ws.send(JSON.stringify(response));
        //     break;
        // }
      }

      const frameReadyListener = cluster.on('frameReady', message => {
        console.log(message);
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
      <ViewportCanvas
        frame={frame}
        frameRendered={frame => console.log(`Rendered frame: ${frame}`)}
      >
        <ViewportView
          viewport={props.config[viewport]}
          viewerPosition={viewerPosition}
        >
          {props.children}
        </ViewportView>
      </ViewportCanvas>
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
