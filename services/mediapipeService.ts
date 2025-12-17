import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export class MediaPipeService {
  private hands: Hands | null = null;
  private camera: Camera | null = null;
  private onResultsCallback: (results: Results) => void;

  constructor(onResults: (results: Results) => void) {
    this.onResultsCallback = onResults;
  }

  public async initialize(videoElement: HTMLVideoElement) {
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.hands.onResults(this.onResultsCallback);

    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        if (this.hands && videoElement) {
          await this.hands.send({ image: videoElement });
        }
      },
      width: 1280,
      height: 720,
    });

    await this.camera.start();
  }

  public cleanup() {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.hands) {
      this.hands.close();
    }
  }
}