import { PropsWithChildren } from "react";
import { Canvas, } from '@react-three/fiber';
import { OrbitControls, Plane, RenderTexture, Sphere } from '@react-three/drei';
import { DoubleSide, Euler, Matrix3, Vector3 } from 'three';
import { AppBar, createTheme, IconButton, ThemeProvider } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import Config, { ViewportConfig } from "./Config";
import ViewportView, { ViewportDebugView } from "./ViewportView";

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

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export interface MasterViewProps extends PropsWithChildren {
  config: Config;
  viewerPosition: Vector3;
  viewerOrientation: Matrix3;
  ipd: number;
  debugViewportFrustum?: string;
}

export function MasterView(props: MasterViewProps) {
  const leftEyePosition = new Vector3(-0.5 * props.ipd, 0, 0).applyMatrix3(props.viewerOrientation).add(props.viewerPosition);
  const rightEyePosition = new Vector3(0.5 * props.ipd, 0, 0).applyMatrix3(props.viewerOrientation).add(props.viewerPosition);

  return (
    <ThemeProvider theme={darkTheme}>
      <AppBar>
        <IconButton>
          <SettingsIcon />
        </IconButton>
      </AppBar>
      <Canvas>
        <Sphere
          position={leftEyePosition}
          args={[0.05]}
        />
        <Sphere
          position={rightEyePosition}
          args={[0.05]}
        />
        { props.children }
        <OrbitControls makeDefault />
        {
          props.debugViewportFrustum ?
            <MasterViewportView
              viewport={props.config[props.debugViewportFrustum]}
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
              viewport={props.config[side]}
              viewerPosition={props.viewerPosition}
            >
              {props.children}
            </MasterViewportView>
          )
        }
      </Canvas>
    </ThemeProvider>
  );
}
