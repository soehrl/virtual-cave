import './App.css';
import Cave from './Cave';
import { useTime } from './Time';

function SpinningCube(props: {color: string, position: [number, number, number]}) {
  const time = useTime();

  const rotation = time;

  return (
    <mesh position={props.position} rotation={[0, rotation, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={props.color} />
    </mesh>
  );
}

function App() {
  return (
    <Cave>
      <SpinningCube position={[-3, -2, 1]} color="green" />
      <SpinningCube position={[3, -3, -5]} color="green" />
      <SpinningCube position={[0, -0.75, 5]} color="green" />

      <SpinningCube position={[0, 4, -5]} color="hotpink" />
      <SpinningCube position={[-5, 0, -5]} color="hotpink" />
      <SpinningCube position={[5, 0, -5]} color="hotpink" />

      <SpinningCube position={[0, 2, 5]} color="orange" />
      <SpinningCube position={[-5, 0, 5]} color="orange" />
      <SpinningCube position={[5, 0, 5]} color="orange" />

      <ambientLight />
      <pointLight position={[10, 10, 10]} />
    </Cave>
  );
}

export default App;
