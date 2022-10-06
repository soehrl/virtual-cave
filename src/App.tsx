import './App.css';
import Cave from './Cave';

function App() {
  return (
    <Cave>
        <mesh position={[-3, -2, 1]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={'green'} />
        </mesh>
        <mesh position={[3, -3, -5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={'green'} />
        </mesh>
        <mesh position={[0, -0.75, 5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={'green'} />
        </mesh>
        <mesh position={[0, 4, -5]}>
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
        <mesh position={[0, 2, 5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={'orange'} />
        </mesh>
        <mesh position={[-5, 0, 5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={'orange'} />
        </mesh>
        <mesh position={[5, 0, 5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={'orange'} />
        </mesh>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
    </Cave>
  );
}

export default App;
