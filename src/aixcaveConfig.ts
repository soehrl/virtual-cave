import Config from './Cave/Config';

const caveSideLength = 5.25;
const caveHeight = 3.3;
const sideViewportWidth = 3.14285;
const sideViewportHeight = 1.964285;

const aixcaveConfig: Config = {
  ngs01: {
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
  },

  front: {
    loc: [0, 0, caveSideLength * 0.5],
    rot: [0, Math.PI, 0],
    top: caveHeight,
    bottom: 0,
    left: -caveSideLength * 0.5,
    right: caveSideLength * 0.5,
  },
  back: {
    loc: [0, 0, -caveSideLength * 0.5],
    rot: [0, 0, 0],
    top: caveHeight,
    bottom: 0,
    left: -caveSideLength * 0.5,
    right: caveSideLength * 0.5,
  },
  left: {
    loc: [-caveSideLength * 0.5, 0, 0],
    rot: [0, Math.PI * 0.5, 0],
    top: caveHeight,
    bottom: 0,
    left: -caveSideLength * 0.5,
    right: caveSideLength * 0.5,
  },
  right: {
    loc: [caveSideLength * 0.5, 0, 0],
    rot: [0, -Math.PI * 0.5, 0],
    top: caveHeight,
    bottom: 0,
    left: -caveSideLength * 0.5,
    right: caveSideLength * 0.5,
  },
  floor: {
    loc: [0, 0, 0],
    rot: [-Math.PI * 0.5, 0, 0],
    top: -caveSideLength * 0.5,
    bottom: caveSideLength * 0.5,
    left: -caveSideLength * 0.5,
    right: caveSideLength * 0.5,
  },
};

export default aixcaveConfig;
