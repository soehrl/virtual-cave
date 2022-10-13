import { forwardRef, PropsWithChildren,  useEffect, useImperativeHandle, useRef, useState } from "react";
import { Canvas, createPortal, useThree } from '@react-three/fiber';
import { Plane, useFBO} from '@react-three/drei';
import { Scene, Texture, WebGLRenderTarget } from 'three';
import Cluster, { useCluster } from "./Cluster";

interface SyncedRenderTexturePortalProps extends PropsWithChildren {
  fbo: WebGLRenderTarget;
}

function SyncedRenderTexturePortal(props: SyncedRenderTexturePortalProps) {
  const { scene, camera, gl, advance } = useThree();
  const cluster = useCluster();

  useEffect(() => {
    if (cluster) {
      const startFrameListener = cluster.on('startFrame', message => {
        cluster.time = message.time;
        // console.log(`Rendering frame ${message.frame}`);
        const t0 = performance.now();
        gl.setRenderTarget(props.fbo);
        gl.render(scene, camera);
        gl.setRenderTarget(null);
        const t1 = performance.now();
        // console.log(`Time: ${t1 - t0}ms`);
        const px = new Uint16Array(4);
        // gl.readRenderTargetPixels(props.fbo, 0, 0, 1, 1, px);
        const t2 = performance.now();
        timeFrameRendered = t2;
        // console.log(px);
        // console.log(`Time: ${t2 - t0}ms`);
        // console.log(scene.toJSON());
        cluster.emit('frameReady', {
          type: 'frameReady',
          frame: message.frame,
        });
      }, { objectify: true });

      return () => { 
        if (!(startFrameListener instanceof Cluster)) {
          startFrameListener.off();
        } else {
          console.log("error");
        }
      }
    }
  }, [cluster, props.fbo]);

  return <>{props.children}</>;
}

interface SyncedRenderTextureProps extends PropsWithChildren {
  attach: string;
}

let timeFrameRendered: number;

function SyncedRenderTexture(props: SyncedRenderTextureProps) {
  const fbo = useFBO();
  const [scene] = useState(() => new Scene())

  return (
    <>
      <primitive object={fbo.texture} attach={props.attach} />
      {
        createPortal(
          <SyncedRenderTexturePortal fbo={fbo}>
            {props.children}
          </SyncedRenderTexturePortal>,
          scene
        )
      }
    </>
  );
};

interface SyncedCanvasContentProps extends PropsWithChildren {
}

function SyncedCanvasContent(props: SyncedCanvasContentProps) {
  const cluster = useCluster();
  const { advance } = useThree();

  useEffect(() => {
    if (cluster) {
      const displayFrameListener = cluster.on('displayFrame', message => {
        const t3 = performance.now();
        // console.log(`Displaying frame ${message.frame}`);
        // console.log(`RTT: ${t3 - timeFrameRendered}ms`);
        advance(1/60);
      }, { objectify: true });

      return () => { 
        if (!(displayFrameListener instanceof Cluster)) {
          displayFrameListener.off();
        } else {
          console.log("error");
        }
      }
    }
  }, [cluster]);

  return (
    <>
      {/*
      <OrthographicCamera
        makeDefault
        args={[-1, 1, 1, -1, -1, 1]}
      />
      */}
      <Plane args={[2, 2, 1, 1]}>
        <meshToonMaterial>
          <SyncedRenderTexture attach="map">
          { props.children }
          </SyncedRenderTexture>
          {/*
            texture.current ? <primitive object={texture.current} attach="map" /> : null
          */}
        </meshToonMaterial>
        <ambientLight />
      </Plane>
    </>
  );
}

export interface SyncedCanvasProps extends PropsWithChildren {
}

export default function SyncedCanvas(props: SyncedCanvasProps) {
  return (
    <Canvas
      frameloop="never"
      style={{ cursor: 'none' }}
    >
      <SyncedCanvasContent>
        { props.children }
      </SyncedCanvasContent>
    </Canvas>
  );
}
