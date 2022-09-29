import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { FirstPersonControls as ThreeFirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls'
import { FlyControls as ThreeFlyControls } from 'three/examples/jsm/controls/FlyControls'
import { useEffect, useState } from 'react'

const OrbitControls = () => {
   const { camera, gl } = useThree();
   useEffect(() => {
       const controls = new ThreeOrbitControls(camera, gl.domElement);
       controls.minDistance = 0.1;
       controls.maxDistance = 100;
       return () => {
         controls.dispose();
       };
    }, [camera, gl]);
   return null;
}
;
const FirstPersonControls = () => {
  const { camera, gl } = useThree();
  const [controls, setControls] = useState<ThreeFirstPersonControls|undefined>();

  useFrame((_, time) => {
    if (controls) {
      controls.update(time);
      console.log(time);
    }
  });

  useEffect(() => {
     const controls = new ThreeFirstPersonControls(camera, gl.domElement);
     controls.autoForward = false;
     controls.movementSpeed = 100;
     controls.lookSpeed = 10;
     controls.activeLook = false;
     setControls(controls);
     return () => {
       controls.dispose();
       setControls(undefined);
     };
  }, [camera, gl]);
  return null;
};

const FlyControls = () => {
  const { camera, gl } = useThree();
  const [controls, setControls] = useState<ThreeFlyControls|undefined>();

  useFrame((_, time) => {
    if (controls) {
      controls.update(time);
      console.log(time);
    }
  });

  useEffect(() => {
     const controls = new ThreeFlyControls(camera, gl.domElement);
     controls.dragToLook = false;
     controls.movementSpeed = 10;
     controls.rollSpeed = 0.1;
     setControls(controls);
     return () => {
       controls.dispose();
       setControls(undefined);
     };
  }, [camera, gl]);
  return null;
};

export { OrbitControls, FirstPersonControls, FlyControls };
