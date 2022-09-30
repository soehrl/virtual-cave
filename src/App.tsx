import React, { useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from './Controls';
import { Color, DoubleSide, Matrix4, Vector3 } from 'three';
import { Box } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

const caveSideLength = 5.25;
const caveHeight = 3.3;

interface WindowConfig {
  loc: [number, number, number],
  rot: [number, number, number],
  top: number,
  bottom: number,
  left: number,
  right: number,
}

type Config = {[window: string]: WindowConfig};

const config: Config = {
  "ngs01": {
    loc: [0, 0, caveSideLength * 0.5],
    rot: [0, 0, 0],
    top: caveHeight,
    bottom: 0,
    left: -caveSideLength * 0.5,
    right: caveSideLength * 0.5,
  }
};

function Glasses(props: any) {
  // This reference will give us direct access to the mesh
  const mesh = useRef()
  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)
  // Subscribe this component to the render-loop, rotate the mesh every frame
  // Return view, these are regular three.js elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? 1.5 : 1}
      onClick={(event) => setActive(!active)}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

function CaveMaterial() {
  return <meshStandardMaterial color={new Color(1.0, 0, 0)} side={DoubleSide} transparent />;
}

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

interface CaveProps {
  glassPosition: [number, number, number];
}

function makeProjectionMatrix(side: WindowConfig, viewerPosition: Vector3) {
  const matrix = new Matrix4();

  const l = side.left;
  const r = side.right;
  const t = side.top;
  const b = side.bottom;
  const n = 0.01;
  const f = 1000.0;
  const x = viewerPosition.x;
  const y = viewerPosition.y;
  const z = viewerPosition.z;

  const rml = r - l;
  const rpl = r + l;
  const tmb = t - b;
  const tpb = t + b;
  const fmn = f - n;
  const z2mfmn = 2 * z - f - n;

  matrix.set(
    2 * z / rml, 0, 0, 0,
    0, 2 * z / tmb, 0, 0,
    (-2 * (x - 0.5 * rpl)) / rml, (-2 * (y - 0.5 * tpb)) / (t - b), z2mfmn / fmn, -1,
    -rpl / rml * z, -tpb / tmb * z, (-z * z2mfmn + 2 * (f - z) * (n - z)) / fmn, z
  );

  return matrix;
}

function Cave(props: CaveProps) {
  return (
    <>
      <Glasses position={props.glassPosition} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[caveSideLength, caveSideLength]} />
        <CaveMaterial />
      </mesh>
      <mesh position={[0, caveHeight * 0.5, caveSideLength * 0.5]} rotation={[0, 0, 0]}>
        <planeGeometry args={[5.25, caveHeight]} />
        <CaveMaterial />
      </mesh>
      <mesh position={[0, caveHeight * 0.5, -caveSideLength * 0.5]} rotation={[0, 0, 0]}>
        <planeGeometry args={[5.25, caveHeight]} />
        <CaveMaterial />
      </mesh>
      <mesh position={[caveSideLength * 0.5, caveHeight * 0.5, 0]} rotation={[0, Math.PI * 0.5, 0]}>
        <planeGeometry args={[5.25, caveHeight]} />
        <CaveMaterial />
      </mesh>
      <mesh position={[-caveSideLength * 0.5, caveHeight * 0.5, 0]} rotation={[0, Math.PI * 0.5, 0]}>
        <planeGeometry args={[5.25, caveHeight]} />
        <CaveMaterial />
      </mesh>
    </>
  );
}

function EgocentricProjection(props: { window: string, position: [number, number, number] }) {
  const { camera } = useThree();
  const position = new Vector3(props.position[0], props.position[1], props.position[2]);
  const matrix = makeProjectionMatrix(config.ngs01, position);
  camera.projectionMatrix = matrix;
  camera.projectionMatrixInverse = matrix.clone().invert();
  camera.position.set(position.x, position.y, position.z);

  console.log(camera.projectionMatrix.toArray());

  return null;
}

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dtrackURI = searchParams.get("dtrack");
  const [p, setP] = useState<[number, number, number]>([0, 0, 0]);
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
            console.log([
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
      <Canvas>
        <EgocentricProjection position={p} window="ngs01" />
        <OrbitControls />
        <mesh position={[0, 0, -5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={'hotpink'} />
        </mesh>
        <mesh position={[-5, 0, -5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={'hotpink'} />
        </mesh>
        <mesh position={[5, 0, -5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={'hotpink'} />
        </mesh>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
      </Canvas>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <Box>
          Tracking Update Rate: {trackingUpdateRate}Hz
        </Box>
      </Box>
    </>
  );
}

export default App;
