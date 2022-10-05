import { PropsWithChildren, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from './Controls';
import { ColorRepresentation, DoubleSide, Euler, Matrix4, Vector3 } from 'three';
import { Box } from '@mui/material';

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
  }
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

function EgocentricProjection(props: { viewport: string, position: [number, number, number] }) {
  const { camera } = useThree();
  const position = new Vector3(props.position[0], props.position[1], props.position[2]);
  const matrix = makeProjectionMatrix(config[props.viewport], position);
  camera.projectionMatrix = matrix;
  camera.projectionMatrixInverse = matrix.clone().invert();
  camera.position.set(position.x, position.y, position.z);

  return null;
}

function ViewportDebugView(props: { viewport: string, position: [number, number, number] }) {
  const viewport = config[props.viewport];
  const position = new Vector3(props.position[0], props.position[1], props.position[2]);
  const matrix = makeProjectionMatrix(config[props.viewport], position);
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
          <Line start={viewportVertices[i]} end={viewportVertices[(i + 1) % 4]} color="black" />
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

function parseInitialCameraPosition(str?: string|null) {
  const p = [0, 0, 0] as [number, number, number];
  if (str) {
    try {
      const pos = JSON.parse(str);
      if (Array.isArray(pos)) {
        for (let i = 0; i < 3; ++i) {
          if (pos.length > i && typeof pos[i] === 'number') {
            p[i] = pos[i];
          }
        }
      }
    } catch (error) {
    }
  }
  return p;
}

export interface CaveProps extends PropsWithChildren {
}

export default function Cave(props: CaveProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const dtrackURI = searchParams.get("dtrack");
  const viewport = searchParams.get("viewport");
  const debugViewportFrustum = searchParams.get("debugViewportFrustum");
  const initialCameraPosition = searchParams.get("initialCameraPosition");
  const [p, setP] = useState<[number, number, number]>(() => parseInitialCameraPosition(initialCameraPosition));
  const [trackingUpdateRate, setTrackingUpdateRate] = useState<number|undefined>();

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
        ++trackingUpdateCount;

        const d = JSON.parse(event.data) as Data;
        if (d.bodies.length > 0) {
          if (d.bodies[0].loc) {
            setP([
              d.bodies[0].loc[0] / 1000,
              d.bodies[0].loc[1] / 1000,
              d.bodies[0].loc[2] / 1000,
            ]);
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
    <>
      <Canvas
        camera={{ manual: !!viewport }}
      >
        {
          viewport ? <EgocentricProjection position={p} viewport={viewport} /> : <OrbitControls />
        }
        {
          debugViewportFrustum ? <ViewportDebugView position={p} viewport={debugViewportFrustum} /> : null
        }
        {
          viewport
          ? null
          : <mesh position={p}>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
              <meshStandardMaterial color={'red'} />
            </mesh>
        }
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[caveSideLength, caveSideLength]} />
          <meshStandardMaterial color={'yellow'} side={DoubleSide} />
        </mesh>
        {props.children}
      </Canvas>
      <Box
        component="div"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <Box component="div">
          Tracking Update Rate: {trackingUpdateRate}
        </Box>
      </Box>
    </>
  );
}
