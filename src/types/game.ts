export interface Bird {
  x: number;
  y: number;
  velocity: number;
  rotation: number;
  width: number;
  height: number;
}

export interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  width: number;
  passed: boolean;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
}

export type GameState = 'start' | 'playing' | 'gameover';

export interface GameConfig {
  gravity: number;
  jumpForce: number;
  pipeSpeed: number;
  pipeGap: number;
  pipeSpawnInterval: number;
  groundHeight: number;
}
