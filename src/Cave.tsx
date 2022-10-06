import { PropsWithChildren, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Plane, RenderTexture, Sphere, TransformControls} from '@react-three/drei';
import { BackSide, Camera, ColorRepresentation, DoubleSide, Euler, Matrix4, Object3D, Vector3 } from 'three';
import { Box } from '@mui/material';
import { TimeContext } from "./Time";

const caveSideLength = 5.25;
const caveHeight = 3.3;
const sideViewportWidth = 3.14285;
const sideViewportHeight = 1.964285;

interface ViewportConfig {
  loc: [number, number, number],
  rot: [number, number, number],
  top: number,
  bottom: number,
  left: number,
  right: number,
}

type Config = {[viewport: string]: ViewportConfig};

const config: Config = {
  "ngs01": {
    loc: [0, 0, -caveSideLength * 0.5],
    rot: [0, Math.PI * 0.5, 0],
    top: caveHeight,
    bottom: 0,
    left: -caveSideLength * 0.5,
    right: caveSideLength * 0.5,
  },
  ngs13: {
    loc: [0, 0, caveSideLength * 0.5],
    rot: [0, Math.PI, 0],
    top: caveHeight,
    bottom: caveHeight - sideViewportHeight,
    left: -caveSideLength * 0.5,
    right: -caveSideLength * 0.5 + sideViewportWidth,
  },
  ngs15: {
    loc: [0, 0, caveSideLength * 0.5],
    rot: [0, Math.PI, 0],
    top: sideViewportHeight,
    bottom: 0,
    left: -caveSideLength * 0.5,
    right: -caveSideLength * 0.5 + sideViewportWidth,
  },

  front: {
    loc: [0, 0, caveSideLength * 0.5],
    rot: [0, Math.PI, 0],
    top: caveHeight,
    bottom: 0,
    left: -caveSideLength * 0.5,
    right: caveSideLength * 0.5,
  },
  back: {
    loc: [0, 0, -caveSideLength * 0.5],
    rot: [0, 0, 0],
    top: caveHeight,
    bottom: 0,
    left: -caveSideLength * 0.5,
    right: caveSideLength * 0.5,
  },
  left: {
    loc: [-caveSideLength * 0.5, 0, 0],
    rot: [0, Math.PI * 0.5, 0],
    top: caveHeight,
    bottom: 0,
    left: -caveSideLength * 0.5,
    right: caveSideLength * 0.5,
  },
  right: {
    loc: [caveSideLength * 0.5, 0, 0],
    rot: [0, -Math.PI * 0.5, 0],
    top: caveHeight,
    bottom: 0,
    left: -caveSideLength * 0.5,
    right: caveSideLength * 0.5,
  },
  floor: {
    loc: [0, 0, 0],
    rot: [-Math.PI * 0.5, 0, 0],
    top: -caveSideLength * 0.5,
    bottom: caveSideLength * 0.5,
    left: -caveSideLength * 0.5,
    right: caveSideLength * 0.5,
  },
};

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

function makeViewportTransform(viewport: ViewportConfig) {
  const viewportTranslation = new Matrix4().makeTranslation(
    viewport.loc[0],
    viewport.loc[1],
    viewport.loc[2],
  );
  const viewportOrientation = new Matrix4().makeRotationFromEuler(new Euler(
    viewport.rot[0],
    viewport.rot[1],
    viewport.rot[2]
  ));

  return new Matrix4().multiplyMatrices(viewportTranslation, viewportOrientation);
}

function makeProjectionMatrix(viewport: ViewportConfig, viewerPosition: Vector3) {
  const viewportTransform = makeViewportTransform(viewport)
  const inverseViewportTransform = viewportTransform.clone().invert();
  const transformedOrigin = new Vector3(0, 0, 0).applyMatrix4(viewportTransform);
  const transformedViewerPosition = viewerPosition.clone().applyMatrix4(inverseViewportTransform);

  const x = transformedViewerPosition.x;
  const y = transformedViewerPosition.y;
  const z = transformedViewerPosition.z;
  const l = viewport.left - x;
  const r = viewport.right - x;
  const t = viewport.top - y;
  const b = viewport.bottom - y;

  const perspective = new Matrix4().makePerspective(l, r, b, t, z, 100);
  const scale = new Matrix4().makeScale(1, -1, 1);
  
  return new Matrix4()
    .multiplyMatrices(scale, perspective)
    .multiply(inverseViewportTransform)
    .multiply(new Matrix4().makeTranslation(transformedOrigin.x, transformedOrigin.y, transformedOrigin.z));
}

function Line(props: { start: Vector3, end: Vector3, color?: ColorRepresentation }) {
  const ref = useRef<any>();

  useLayoutEffect(() => {
    ref.current.geometry.setFromPoints([props.start, props.end]);
  }, [props.start, props.end])

  return (
    <line ref={ref}>
      <bufferGeometry />
      <lineBasicMaterial color={props.color || 'black'} />
    </line>
  )
}

interface EgocentricProjectionProps {
  viewport: ViewportConfig;
  viewerPosition: Vector3;
}

function EgocentricProjection(props: EgocentricProjectionProps) {
  const { camera, set } = useThree();
  const cameraRef = useRef<any>();

  useEffect(() => {
    const matrix = makeProjectionMatrix(props.viewport, props.viewerPosition);
    if (cameraRef.current) {
      cameraRef.current.projectionMatrix = matrix;
      cameraRef.current.projectionMatrixInverse = matrix.clone().invert();
      cameraRef.current.position.copy(props.viewerPosition);
      cameraRef.current.manual = true;
    }
  }, [props.viewport, props.viewerPosition, cameraRef.current]);

  useEffect(() => {
    const oldCamera = camera;
    set({ camera: cameraRef.current });
    return () => set({ camera: oldCamera });
  }, [cameraRef]);

  return <camera ref={cameraRef} />;
}

function ViewportDebugView(props: { viewport: ViewportConfig, position: Vector3 }) {
  const viewport = props.viewport;
  const position = props.position;
  const matrix = makeProjectionMatrix(viewport, position);
  const inverse = matrix.clone().invert();

  const vertices = [
    new Vector3(-1, 1, 1),
    new Vector3(1, 1, 1),
    new Vector3(1, -1, 1),
    new Vector3(-1, -1, 1),
    new Vector3(-1, 1, -1),
    new Vector3(1, 1, -1),
    new Vector3(1, -1, -1),
    new Vector3(-1, -1, -1),
  ];
  const transformed = vertices.map(v => v.clone().applyMatrix4(inverse).add(position));
  const viewportTransform = makeViewportTransform(viewport);

  const l = viewport.left;
  const r = viewport.right;
  const t = viewport.top;
  const b = viewport.bottom;

  const viewportVertices = [
    new Vector3(l, b, 0).applyMatrix4(viewportTransform),
    new Vector3(l, t, 0).applyMatrix4(viewportTransform),
    new Vector3(r, t, 0).applyMatrix4(viewportTransform),
    new Vector3(r, b, 0).applyMatrix4(viewportTransform),
  ];

  return (
    <>
    {
      [0, 1, 2, 3].map(i =>
        <Line start={transformed[i]} end={transformed[i + 4]} color="green" />
      )
    }
    {
      [0, 1, 2, 3].map(i =>
        <>
          {/* <Line start={viewportVertices[i]} end={viewportVertices[(i + 1) % 4]} color="black" />*/}
          <Line start={transformed[i]} end={transformed[(i + 1) % 4]} color="green" />
          <Line start={transformed[i + 4]} end={transformed[4 + (i + 1) % 4]} color="green" />
        </>
      )
    }
    {
    transformed.map(v =>
      <mesh position={v}>
        <sphereGeometry args={[0.05]} />
        <meshStandardMaterial color={'hotpink'} />
      </mesh>
    )
    }
    </>
  );
}

interface ViewportViewProps extends PropsWithChildren {
  viewport: ViewportConfig;
  viewerPosition: Vector3;
}

function ViewportView(props: ViewportViewProps) {
  return (
    <>
      <color attach="background" args={["black"]} />
      <EgocentricProjection viewport={props.viewport} viewerPosition={props.viewerPosition} />
      {props.children}
    </>
  );
}

interface MasterViewportViewProps extends PropsWithChildren {
  viewport: ViewportConfig;
  viewerPosition: Vector3;
  debug?: boolean;
}

function MasterViewportView(props: MasterViewportViewProps) {
  const l = props.viewport.left;
  const r = props.viewport.right;
  const t = props.viewport.top;
  const b = props.viewport.bottom;

  const position = new Vector3(...props.viewport.loc);
  const planePosition = new Vector3((r + l) * 0.5, (t + b) * 0.5, 0);

  return (
    <>
      <group
        position={position}
        rotation={new Euler(...props.viewport.rot)}
      >
        <Plane
          position={planePosition}
          args={[r - l, t - b, 1, 1]}
        >
          <meshStandardMaterial side={DoubleSide} opacity={0.9} transparent>
            <RenderTexture attach="map" width={100} height={100}>
              <ViewportView
                viewport={props.viewport}
                viewerPosition={props.viewerPosition}
              >
              { props.children }
              </ViewportView>
            </RenderTexture>
          </meshStandardMaterial>
        </Plane>
      </group>
      {
        props.debug ?
          <ViewportDebugView
            viewport={props.viewport}
            position={props.viewerPosition}
          />
        : null
      }
    </>
  );
}

interface MasterViewProps extends PropsWithChildren {
  viewerPosition: Vector3;
  debugViewportFrustum?: string;
}

function MasterView(props: MasterViewProps) {
  return (
    <Canvas>
      <Sphere
        position={props.viewerPosition}
        args={[0.1]}
      />
      { props.children }
      <OrbitControls makeDefault />
      {
        props.debugViewportFrustum ?
          <MasterViewportView
            viewport={config[props.debugViewportFrustum]}
            viewerPosition={props.viewerPosition}
            debug
          >
            {props.children}
          </MasterViewportView>
        : null
      }
      {
        ['front', 'back', 'left', 'right', 'floor'].map(side =>
          <MasterViewportView
            key={side}
            viewport={config[side]}
            viewerPosition={props.viewerPosition}
          >
            {props.children}
          </MasterViewportView>
        )
      }
    </Canvas>
  );
}

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
}

export default function Cave(props: CaveProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const dtrackURI = searchParams.get("dtrack");
  const viewport = searchParams.get("viewport");
  const debugViewportFrustum = searchParams.get("debugViewportFrustum");
  const initialViewerPosition = searchParams.get("initialViewerPosition");
  const [viewerPosition, setViewerPosition] = useState(() => parseInitialViewerPosition(initialViewerPosition));
  const [trackingUpdateRate, setTrackingUpdateRate] = useState<number|undefined>();
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
          viewport={config[viewport]}
          viewerPosition={viewerPosition}
        >
          {props.children}
        </ViewportView>
      </Canvas>
      : 
      <MasterView
        viewerPosition={viewerPosition}
        debugViewportFrustum={debugViewportFrustum || undefined}
      >
        {props.children}
      </MasterView>
      }
    </TimeContext.Provider>
  );
}
