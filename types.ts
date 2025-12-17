export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandResults {
  multiHandLandmarks: HandLandmark[][];
  multiHandedness: any[];
}

export interface AppState {
  sides: number;
  color: string;
  rotationX: number;
  isCameraReady: boolean;
}