import { wifiMotionService, WiFiMotionDetectionResult } from './wifiMotionService';
import { bluetoothMotionService, BluetoothDeviceData, MotionDetectionResult as BluetoothMotionResult } from './bluetoothMotionService';
import { cameraService, MotionDetectionFrame } from './cameraService';

interface CombinedMotionResult {
  isMotionDetected: boolean;
  confidence: number;
  sources: {
    wifi: boolean;
    bluetooth: boolean;
    camera: boolean;
  };
  location: { x: number; y: number; estimatedDistance: number };
  detectedAt: Date;
  wallPenetration: {
    detected: boolean;
    material: string;
    confidence: number;
  };
}

interface WallMaterial {
  name: string;
  signalAttenuation: {
    wifi: number;
    bluetooth: number;
  };
}

class MotionDetectionEngine {
  private isRunning: boolean = false;
  private detectionInterval: number | null = null;
  private motionHistory: CombinedMotionResult[] = [];
  private maxHistoryLength: number = 100;
  private wallMaterials: WallMaterial[] = [
    { name: 'Drywall', signalAttenuation: { wifi: 0.3, bluetooth: 0.4 } },
    { name: 'Concrete', signalAttenuation: { wifi: 0.6, bluetooth: 0.7 } },
    { name: 'Wood', signalAttenuation: { wifi: 0.2, bluetooth: 0.3 } },
    { name: 'Glass', signalAttenuation: { wifi: 0.1, bluetooth: 0.15 } },
    { name: 'Metal', signalAttenuation: { wifi: 0.9, bluetooth: 0.95 } }
  ];

  async startDetection(intervalMs: number = 500): Promise<void> {
    if (this.isRunning) {
      console.log('Detection already running');
      return;
    }

    this.isRunning = true;
    
    // Start all monitoring services
    try {
      await wifiMotionService.startMonitoring();
      await bluetoothMotionService.startScanning();
      // Camera will be started separately by the UI component
      
      this.detectionInterval = window.setInterval(() => {
        this.performDetection();
      }, intervalMs);

      console.log('Motion detection engine started');
    } catch (error) {
      console.error('Failed to start detection:', error);
      this.isRunning = false;
      throw error;
    }
  }

  private async performDetection(): Promise<void> {
    const wifiResult = wifiMotionService.detectMotion();
    const bluetoothDevices = bluetoothMotionService.getAllDevices();
    const cameraResult = cameraService.isRunning() ? cameraService.detectMotion() : null;

    // Analyze Bluetooth signals for motion
    let bluetoothMotionDetected = false;
    let bluetoothConfidence = 0;
    
    bluetoothDevices.forEach(device => {
      const motionResult = bluetoothMotionService.detectMotion(device.device.id);
      if (motionResult.isMotionDetected) {
        bluetoothMotionDetected = true;
        bluetoothConfidence = Math.max(bluetoothConfidence, motionResult.confidence);
      }
    });

    // Combine results with weighted confidence
    const weights = {
      wifi: 0.4,
      bluetooth: 0.3,
      camera: 0.3
    };

    const wifiWeighted = wifiResult.isMotionDetected ? wifiResult.confidence * weights.wifi : 0;
    const bluetoothWeighted = bluetoothMotionDetected ? bluetoothConfidence * weights.bluetooth : 0;
    const cameraWeighted = cameraResult?.motionDetected ? cameraResult.confidence * weights.camera : 0;

    const totalConfidence = wifiWeighted + bluetoothWeighted + cameraWeighted;
    const isMotionDetected = totalConfidence > 30; // Threshold for combined detection

    // Estimate location using WiFi and Bluetooth data
    const location = this.estimateLocation(wifiResult, bluetoothDevices);

    // Detect wall penetration
    const wallPenetration = this.detectWallPenetration(wifiResult, bluetoothDevices);

    const result: CombinedMotionResult = {
      isMotionDetected,
      confidence: totalConfidence,
      sources: {
        wifi: wifiResult.isMotionDetected,
        bluetooth: bluetoothMotionDetected,
        camera: cameraResult?.motionDetected || false
      },
      location,
      detectedAt: new Date(),
      wallPenetration
    };

    this.motionHistory.push(result);
    
    if (this.motionHistory.length > this.maxHistoryLength) {
      this.motionHistory.shift();
    }

    // Trigger alert if motion is detected through wall
    if (isMotionDetected && wallPenetration.detected) {
      this.triggerAlert(result);
    }
  }

  private estimateLocation(
    wifiResult: WiFiMotionDetectionResult,
    bluetoothDevices: BluetoothDeviceData[]
  ): { x: number; y: number; estimatedDistance: number } {
    // Use WiFi CSI location as primary
    let x = wifiResult.location.x;
    let y = wifiResult.location.y;
    
    // Refine with Bluetooth signal strength if available
    if (bluetoothDevices.length > 0) {
      const avgRSSI = bluetoothDevices.reduce((sum, d) => sum + d.rssi, 0) / bluetoothDevices.length;
      
      // Estimate distance based on RSSI (simplified path loss model)
      // Distance = 10^((txPower - rssi) / (10 * n))
      // where n is path loss exponent (typically 2-4)
      const txPower = -40; // Typical BLE TX power
      const pathLossExponent = 2.5;
      const estimatedDistance = Math.pow(10, (txPower - avgRSSI) / (10 * pathLossExponent));
      
      // Adjust location based on estimated distance
      const angle = Math.random() * 2 * Math.PI; // In real implementation, use multiple devices for triangulation
      x += Math.cos(angle) * estimatedDistance * 0.3;
      y += Math.sin(angle) * estimatedDistance * 0.3;

      return { x, y, estimatedDistance };
    }

    return { x, y, estimatedDistance: 0 };
  }

  private detectWallPenetration(
    wifiResult: WiFiMotionDetectionResult,
    bluetoothDevices: BluetoothDeviceData[]
  ): { detected: boolean; material: string; confidence: number } {
    // Analyze signal patterns to determine if motion is behind a wall
    // Key indicators:
    // 1. WiFi CSI shows motion but camera doesn't
    // 2. Signal strength is lower than expected for direct line-of-sight
    // 3. Signal patterns show attenuation characteristics

    const cameraRunning = cameraService.isRunning();
    const cameraMotion = cameraRunning ? cameraService.detectMotion().motionDetected : false;
    
    // If WiFi/Bluetooth detect motion but camera doesn't, likely through-wall
    if ((wifiResult.isMotionDetected || bluetoothDevices.length > 0) && !cameraMotion) {
      // Analyze signal attenuation to determine material
      const signalQuality = wifiResult.signalQuality;
      
      // Find best matching material based on attenuation
      let bestMatch = this.wallMaterials[0];
      let bestMatchScore = 0;
      
      this.wallMaterials.forEach(material => {
        const expectedAttenuation = (material.signalAttenuation.wifi + material.signalAttenuation.bluetooth) / 2;
        const actualAttenuation = 1 - (signalQuality / 100);
        const score = 1 - Math.abs(expectedAttenuation - actualAttenuation);
        
        if (score > bestMatchScore) {
          bestMatch = material;
          bestMatchScore = score;
        }
      });

      return {
        detected: true,
        material: bestMatch.name,
        confidence: bestMatchScore * 100
      };
    }

    return {
      detected: false,
      material: 'None',
      confidence: 0
    };
  }

  private triggerAlert(result: CombinedMotionResult): void {
    // Create alert event
    const event = new CustomEvent('motion-alert', {
      detail: result
    });
    window.dispatchEvent(event);

    console.log('MOTION ALERT:', result);
  }

  stopDetection(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    wifiMotionService.stopMonitoring();
    bluetoothMotionService.stopScanning();
    cameraService.stopCapture();

    this.isRunning = false;
    this.motionHistory = [];

    console.log('Motion detection engine stopped');
  }

  isEngineRunning(): boolean {
    return this.isRunning;
  }

  getMotionHistory(): CombinedMotionResult[] {
    return [...this.motionHistory];
  }

  getLatestResult(): CombinedMotionResult | null {
    return this.motionHistory[this.motionHistory.length - 1] || null;
  }

  getStatistics(): {
    totalDetections: number;
    throughWallDetections: number;
    averageConfidence: number;
    bySource: { wifi: number; bluetooth: number; camera: number };
  } {
    const totalDetections = this.motionHistory.filter(r => r.isMotionDetected).length;
    const throughWallDetections = this.motionHistory.filter(r => r.isMotionDetected && r.wallPenetration.detected).length;
    const averageConfidence = this.motionHistory.length > 0
      ? this.motionHistory.reduce((sum, r) => sum + r.confidence, 0) / this.motionHistory.length
      : 0;

    const bySource = {
      wifi: this.motionHistory.filter(r => r.sources.wifi).length,
      bluetooth: this.motionHistory.filter(r => r.sources.bluetooth).length,
      camera: this.motionHistory.filter(r => r.sources.camera).length
    };

    return {
      totalDetections,
      throughWallDetections,
      averageConfidence,
      bySource
    };
  }

  setMaxHistoryLength(length: number): void {
    this.maxHistoryLength = length;
  }
}

export const motionDetectionEngine = new MotionDetectionEngine();
export type { CombinedMotionResult, WallMaterial };
