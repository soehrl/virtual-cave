export interface ViewportConfig {
  loc: [number, number, number],
  rot: [number, number, number],
  top: number,
  bottom: number,
  left: number,
  right: number,
}

type Config = {[viewport: string]: ViewportConfig};

export default Config;
