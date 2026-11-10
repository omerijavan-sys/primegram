// Type declarations for Web Bluetooth API
declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
  
  interface Bluetooth {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  }
  
  interface RequestDeviceOptions {
    acceptAllDevices?: boolean;
    optionalServices?: string[];
  }
  
  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(event: string, handler: () => void): void;
  }
  
  interface BluetoothRemoteGATTServer {
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
  }
}

interface BluetoothDeviceData {
  device: any;
  rssi: number;
  timestamp: number;
}

interface MotionDetectionResult {
  isMotionDetected: boolean;
  confidence: number;
  signalChange: number;
  detectedAt: Date;
}

class BluetoothMotionService {
  private devices: Map<string, BluetoothDeviceData> = new Map();
  private rssiHistory: Map<string, number[]> = new Map();
  private isScanning: boolean = false;
  private motionThreshold: number = 10; // dBm change threshold
  private historyLength: number = 20; // Number of samples to keep
  private scanInterval: ReturnType<typeof setInterval> | null = null;

  async startScanning(): Promise<void> {
    if (this.isScanning) {
      console.log('Already scanning');
      return;
    }

    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API is not supported in this browser');
    }

    try {
      this.isScanning = true;
      
      // Request device with acceptAllDevices: true to scan for any BLE device
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      console.log('Device found:', device.name);

      device.addEventListener('gattserverdisconnected', () => {
        console.log('Device disconnected');
        this.devices.delete(device.id);
      });

      // Connect to device to get RSSI data
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      // Start monitoring RSSI
      this.startRSSIMonitoring(device);

    } catch (error) {
      console.error('Bluetooth scanning error:', error);
      this.isScanning = false;
      throw error;
    }
  }

  private startRSSIMonitoring(device: any): void {
    // Since Web Bluetooth API doesn't directly provide RSSI,
    // we'll use advertisement monitoring if available
    this.scanInterval = setInterval(() => {
      this.simulateRSSIReading(device);
    }, 1000);
  }

  private simulateRSSIReading(device: any): void {
    // In a real implementation, this would use the advertisementreceived event
    // For now, we'll simulate RSSI changes based on motion
    const baseRSSI = -60; // Typical RSSI for nearby devices
    const noise = (Math.random() - 0.5) * 5; // Random noise
    const motionEffect = Math.random() > 0.7 ? (Math.random() - 0.5) * 15 : 0; // Simulated motion
    
    const rssi = baseRSSI + noise + motionEffect;
    const timestamp = Date.now();

    const deviceData: BluetoothDeviceData = {
      device,
      rssi,
      timestamp
    };

    this.devices.set(device.id, deviceData);

    // Update RSSI history
    if (!this.rssiHistory.has(device.id)) {
      this.rssiHistory.set(device.id, []);
    }
    
    const history = this.rssiHistory.get(device.id)!;
    history.push(rssi);
    
    if (history.length > this.historyLength) {
      history.shift();
    }
  }

  detectMotion(deviceId: string): MotionDetectionResult {
    const history = this.rssiHistory.get(deviceId);
    
    if (!history || history.length < 5) {
      return {
        isMotionDetected: false,
        confidence: 0,
        signalChange: 0,
        detectedAt: new Date()
      };
    }

    // Calculate signal variance
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);

    // Detect significant signal changes
    const recentChange = Math.abs(history[history.length - 1] - history[history.length - 5]);
    const isMotionDetected = recentChange > this.motionThreshold || stdDev > 5;

    // Calculate confidence based on signal stability
    const confidence = Math.min(100, (stdDev / 10) * 100);

    return {
      isMotionDetected,
      confidence,
      signalChange: recentChange,
      detectedAt: new Date()
    };
  }

  getAllDevices(): BluetoothDeviceData[] {
    return Array.from(this.devices.values());
  }

  stopScanning(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    
    // Disconnect all devices
    this.devices.forEach((data) => {
      data.device.gatt?.disconnect();
    });
    
    this.devices.clear();
    this.rssiHistory.clear();
    this.isScanning = false;
  }

  isRunning(): boolean {
    return this.isScanning;
  }

  setMotionThreshold(threshold: number): void {
    this.motionThreshold = threshold;
  }

  setHistoryLength(length: number): void {
    this.historyLength = length;
  }
}

export const bluetoothMotionService = new BluetoothMotionService();
export type { BluetoothDeviceData, MotionDetectionResult };
