import React, { useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from './Controls';
import { Color, DoubleSide } from 'three';

function Box(props: any) {
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

function Cave() {

  const ws = new WebSocket("ws://localhost:5000");

  const [p, setP] = useState<[number, number, number]>([0, 0, 0]);

  ws.onmessage = event => {
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


  return (
    <>
      <Box position={p} />
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

const caveSideLength = 5.25;
const caveHeight = 4;

function App() {
  return (
    <Canvas>
      <OrbitControls />
      <Cave />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
    </Canvas>
  );
}

export default App;
