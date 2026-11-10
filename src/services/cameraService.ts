interface CameraFrame {
  imageData: string;
  timestamp: number;
}

interface MotionDetectionFrame {
  frame: CameraFrame;
  motionDetected: boolean;
  confidence: number;
  regions: { x: number; y: number; width: number; height: number }[];
}

class CameraService {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private isStreaming: boolean = false;
  private captureInterval: number | null = null;
  private previousFrame: string | null = null;
  private motionThreshold: number = 30; // Pixel difference threshold
  private frameHistory: CameraFrame[] = [];
  private maxHistoryLength: number = 10;

  async initializeCamera(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): Promise<void> {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;

    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
        this.isStreaming = true;
      }

      console.log('Camera initialized successfully');
    } catch (error) {
      console.error('Camera initialization error:', error);
      throw new Error('Failed to initialize camera: ' + (error as Error).message);
    }
  }

  startCapture(fps: number = 10): void {
    if (!this.isStreaming || !this.videoElement || !this.canvasElement) {
      throw new Error('Camera not initialized');
    }

    const intervalMs = 1000 / fps;
    
    this.captureInterval = window.setInterval(() => {
      this.captureFrame();
    }, intervalMs);

    console.log(`Camera capture started at ${fps} FPS`);
  }

  private captureFrame(): void {
    if (!this.videoElement || !this.canvasElement) return;

    const ctx = this.canvasElement.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    this.canvasElement.width = this.videoElement.videoWidth;
    this.canvasElement.height = this.videoElement.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(this.videoElement, 0, 0);

    // Get image data
    const imageData = this.canvasElement.toDataURL('image/jpeg', 0.8);
    
    const frame: CameraFrame = {
      imageData,
      timestamp: Date.now()
    };

    this.frameHistory.push(frame);
    
    if (this.frameHistory.length > this.maxHistoryLength) {
      this.frameHistory.shift();
    }

    this.previousFrame = imageData;
  }

  detectMotion(): MotionDetectionFrame {
    if (this.frameHistory.length < 2) {
      return {
        frame: this.frameHistory[0] || { imageData: '', timestamp: Date.now() },
        motionDetected: false,
        confidence: 0,
        regions: []
      };
    }

    const currentFrame = this.frameHistory[this.frameHistory.length - 1];
    const previousFrame = this.frameHistory[this.frameHistory.length - 2];

    const motionResult = this.compareFrames(currentFrame, previousFrame);
    
    return {
      frame: currentFrame,
      ...motionResult
    };
  }

  private compareFrames(frame1: CameraFrame, frame2: CameraFrame): {
    motionDetected: boolean;
    confidence: number;
    regions: { x: number; y: number; width: number; height: number }[];
  } {
    // Create temporary canvases for frame comparison
    const canvas1 = document.createElement('canvas');
    const canvas2 = document.createElement('canvas');
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');

    if (!ctx1 || !ctx2) {
      return { motionDetected: false, confidence: 0, regions: [] };
    }

    const img1 = new Image();
    const img2 = new Image();

    return new Promise((resolve) => {
      img1.onload = () => {
        img2.onload = () => {
          canvas1.width = img1.width;
          canvas1.height = img1.height;
          canvas2.width = img2.width;
          canvas2.height = img2.height;

          ctx1.drawImage(img1, 0, 0);
          ctx2.drawImage(img2, 0, 0);

          const data1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
          const data2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);

          const diff = this.computePixelDifference(data1.data, data2.data);
          const regions = this.detectMotionRegions(data1.data, data2.data, canvas1.width, canvas1.height);

          resolve({
            motionDetected: diff > this.motionThreshold,
            confidence: Math.min(100, diff),
            regions
          });
        };
        img2.src = frame2.imageData;
      };
      img1.src = frame1.imageData;
    }) as any;
  }

  private computePixelDifference(data1: Uint8ClampedArray, data2: Uint8ClampedArray): number {
    let totalDiff = 0;
    const pixelCount = data1.length / 4;

    for (let i = 0; i < data1.length; i += 4) {
      const rDiff = Math.abs(data1[i] - data2[i]);
      const gDiff = Math.abs(data1[i + 1] - data2[i + 1]);
      const bDiff = Math.abs(data1[i + 2] - data2[i + 2]);
      
      totalDiff += (rDiff + gDiff + bDiff) / 3;
    }

    return totalDiff / pixelCount;
  }

  private detectMotionRegions(
    data1: Uint8ClampedArray,
    data2: Uint8ClampedArray,
    width: number,
    height: number
  ): { x: number; y: number; width: number; height: number }[] {
    const regions: { x: number; y: number; width: number; height: number }[] = [];
    const blockSize = 32; // Size of detection blocks
    const blocksX = Math.ceil(width / blockSize);
    const blocksY = Math.ceil(height / blockSize);

    for (let blockY = 0; blockY < blocksY; blockY++) {
      for (let blockX = 0; blockX < blocksX; blockX++) {
        let blockDiff = 0;
        let pixelCount = 0;

        for (let y = 0; y < blockSize; y++) {
          for (let x = 0; x < blockSize; x++) {
            const pixelX = blockX * blockSize + x;
            const pixelY = blockY * blockSize + y;
            
            if (pixelX >= width || pixelY >= height) continue;

            const idx = (pixelY * width + pixelX) * 4;
            const rDiff = Math.abs(data1[idx] - data2[idx]);
            const gDiff = Math.abs(data1[idx + 1] - data2[idx + 1]);
            const bDiff = Math.abs(data1[idx + 2] - data2[idx + 2]);
            
            blockDiff += (rDiff + gDiff + bDiff) / 3;
            pixelCount++;
          }
        }

        const avgDiff = blockDiff / pixelCount;
        
        if (avgDiff > this.motionThreshold) {
          regions.push({
            x: blockX * blockSize,
            y: blockY * blockSize,
            width: blockSize,
            height: blockSize
          });
        }
      }
    }

    return regions;
  }

  stopCapture(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.isStreaming = false;
    this.frameHistory = [];
    this.previousFrame = null;

    console.log('Camera capture stopped');
  }

  getLatestFrame(): CameraFrame | null {
    return this.frameHistory[this.frameHistory.length - 1] || null;
  }

  getFrameHistory(): CameraFrame[] {
    return [...this.frameHistory];
  }

  isRunning(): boolean {
    return this.isStreaming;
  }

  setMotionThreshold(threshold: number): void {
    this.motionThreshold = threshold;
  }

  setMaxHistoryLength(length: number): void {
    this.maxHistoryLength = length;
  }
}

export const cameraService = new CameraService();
export type { CameraFrame, MotionDetectionFrame };
