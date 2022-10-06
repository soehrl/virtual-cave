import { PropsWithChildren, useEffect, useLayoutEffect, useRef } from "react";
import { useThree } from '@react-three/fiber';
import { ColorRepresentation, Euler, Matrix4, Vector3 } from 'three';
import { ViewportConfig } from "./Config";

export function makeViewportTransform(viewport: ViewportConfig) {
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

export function makeProjectionMatrix(viewport: ViewportConfig, viewerPosition: Vector3) {
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

export interface EgocentricProjectionProps {
  viewport: ViewportConfig;
  viewerPosition: Vector3;
}

export function EgocentricProjection(props: EgocentricProjectionProps) {
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

export function ViewportDebugView(props: { viewport: ViewportConfig, position: Vector3 }) {
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

export interface ViewportViewProps extends PropsWithChildren {
  viewport: ViewportConfig;
  viewerPosition: Vector3;
}

export default function ViewportView(props: ViewportViewProps) {
  return (
    <>
      <color attach="background" args={["black"]} />
      <EgocentricProjection viewport={props.viewport} viewerPosition={props.viewerPosition} />
      {props.children}
    </>
  );
}
