interface CSIData {
  amplitude: number;
  phase: number;
  timestamp: number;
}

interface WiFiMotionDetectionResult {
  isMotionDetected: boolean;
  confidence: number;
  location: { x: number; y: number };
  detectedAt: Date;
  signalQuality: number;
}

class WiFiMotionService {
  private csiHistory: CSIData[] = [];
  private isMonitoring: boolean = false;
  private monitorInterval: number | null = null;
  private motionThreshold: number = 0.15; // CSI amplitude change threshold
  private historyLength: number = 50; // Number of CSI samples to keep

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Already monitoring WiFi');
      return;
    }

    this.isMonitoring = true;
    
    // Simulate CSI data collection
    // In a real implementation, this would connect to ESP32 hardware
    // via WebSocket or serial interface to get actual CSI data
    this.monitorInterval = window.setInterval(() => {
      this.simulateCSIData();
    }, 100); // 10Hz sampling rate

    console.log('WiFi CSI monitoring started');
  }

  private simulateCSIData(): void {
    // Simulate CSI amplitude and phase data
    // Real CSI data contains complex channel information
    // from multiple subcarriers across WiFi channels
    
    const baseAmplitude = 1.0;
    const noise = (Math.random() - 0.5) * 0.1;
    const motionEffect = this.isMotionPresent() ? (Math.random() - 0.5) * 0.3 : 0;
    
    const amplitude = baseAmplitude + noise + motionEffect;
    const phase = Math.random() * 2 * Math.PI; // Random phase
    
    const csiData: CSIData = {
      amplitude,
      phase,
      timestamp: Date.now()
    };

    this.csiHistory.push(csiData);
    
    if (this.csiHistory.length > this.historyLength) {
      this.csiHistory.shift();
    }
  }

  private isMotionPresent(): boolean {
    // Simulate motion presence based on time
    // In real implementation, this would be detected from actual CSI changes
    const now = Date.now();
    return Math.sin(now / 2000) > 0.3; // Periodic motion simulation
  }

  detectMotion(): WiFiMotionDetectionResult {
    if (this.csiHistory.length < 10) {
      return {
        isMotionDetected: false,
        confidence: 0,
        location: { x: 0, y: 0 },
        detectedAt: new Date(),
        signalQuality: 0
      };
    }

    // Analyze CSI amplitude changes
    const recentAmplitudes = this.csiHistory.slice(-10).map(d => d.amplitude);
    const olderAmplitudes = this.csiHistory.slice(-20, -10).map(d => d.amplitude);
    
    const recentMean = recentAmplitudes.reduce((a, b) => a + b, 0) / recentAmplitudes.length;
    const olderMean = olderAmplitudes.reduce((a, b) => a + b, 0) / olderAmplitudes.length;
    
    const amplitudeChange = Math.abs(recentMean - olderMean);
    
    // Calculate variance for confidence
    const variance = recentAmplitudes.reduce((sum, val) => sum + Math.pow(val - recentMean, 2), 0) / recentAmplitudes.length;
    const stdDev = Math.sqrt(variance);
    
    // Detect motion based on amplitude changes
    const isMotionDetected = amplitudeChange > this.motionThreshold || stdDev > 0.1;
    
    // Calculate confidence
    const confidence = Math.min(100, (stdDev / 0.2) * 100);
    
    // Estimate location based on phase differences (simplified)
    const location = this.estimateLocation();
    
    // Calculate signal quality based on amplitude stability
    const signalQuality = Math.max(0, 100 - (stdDev / 0.3) * 100);

    return {
      isMotionDetected,
      confidence,
      location,
      detectedAt: new Date(),
      signalQuality
    };
  }

  private estimateLocation(): { x: number; y: number } {
    // Simplified location estimation based on phase
    // Real implementation would use multiple antennas and triangulation
    if (this.csiHistory.length < 2) {
      return { x: 0, y: 0 };
    }

    const latestPhase = this.csiHistory[this.csiHistory.length - 1].phase;
    const previousPhase = this.csiHistory[this.csiHistory.length - 2].phase;
    
    const phaseDifference = latestPhase - previousPhase;
    
    // Map phase difference to 2D space (simplified)
    const x = Math.cos(phaseDifference) * 5; // 5 meter range
    const y = Math.sin(phaseDifference) * 5;
    
    return { x, y };
  }

  getCSIHistory(): CSIData[] {
    return [...this.csiHistory];
  }

  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    this.csiHistory = [];
    this.isMonitoring = false;
    
    console.log('WiFi CSI monitoring stopped');
  }

  isRunning(): boolean {
    return this.isMonitoring;
  }

  setMotionThreshold(threshold: number): void {
    this.motionThreshold = threshold;
  }

  setHistoryLength(length: number): void {
    this.historyLength = length;
  }

  getSignalQuality(): number {
    if (this.csiHistory.length === 0) return 0;
    
    const amplitudes = this.csiHistory.map(d => d.amplitude);
    const mean = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
    const variance = amplitudes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amplitudes.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, 100 - (stdDev / 0.3) * 100);
  }
}

export const wifiMotionService = new WiFiMotionService();
export type { CSIData, WiFiMotionDetectionResult };
