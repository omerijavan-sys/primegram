import { useState, useEffect, useRef } from 'react';
import { motionDetectionEngine, CombinedMotionResult } from '@/services/motionDetectionEngine';
import { wifiMotionService } from '@/services/wifiMotionService';
import { bluetoothMotionService } from '@/services/bluetoothMotionService';
import { cameraService } from '@/services/cameraService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  Wifi, 
  Bluetooth, 
  Activity, 
  AlertTriangle, 
  Shield, 
  Settings,
  Play,
  Square,
  Signal,
  MapPin
} from 'lucide-react';

const MotionDetectionPage = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [latestResult, setLatestResult] = useState<CombinedMotionResult | null>(null);
  const [statistics, setStatistics] = useState({
    totalDetections: 0,
    throughWallDetections: 0,
    averageConfidence: 0,
    bySource: { wifi: 0, bluetooth: 0, camera: 0 }
  });
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [sensitivity, setSensitivity] = useState([50]);
  const [alerts, setAlerts] = useState<CombinedMotionResult[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Listen for motion alerts
    const handleAlert = (event: CustomEvent<CombinedMotionResult>) => {
      setAlerts(prev => [event.detail, ...prev].slice(0, 10));
    };

    window.addEventListener('motion-alert', handleAlert as EventListener);

    return () => {
      window.removeEventListener('motion-alert', handleAlert as EventListener);
    };
  }, []);

  useEffect(() => {
    // Update statistics periodically
    const interval = setInterval(() => {
      if (isRunning) {
        setStatistics(motionDetectionEngine.getStatistics());
        setLatestResult(motionDetectionEngine.getLatestResult());
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = async () => {
    try {
      if (cameraEnabled && videoRef.current && canvasRef.current) {
        await cameraService.initializeCamera(videoRef.current, canvasRef.current);
        cameraService.startCapture(10);
      }

      await motionDetectionEngine.startDetection(500);
      setIsRunning(true);
    } catch (error) {
      console.error('Failed to start detection:', error);
      alert('Failed to start motion detection. Please ensure camera and Bluetooth permissions are granted.');
    }
  };

  const handleStop = () => {
    motionDetectionEngine.stopDetection();
    setIsRunning(false);
    setLatestResult(null);
  };

  const handleSensitivityChange = (value: number[]) => {
    setSensitivity(value);
    const threshold = 100 - value[0];
    wifiMotionService.setMotionThreshold(threshold / 100);
    bluetoothMotionService.setMotionThreshold(threshold);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              RF Motion Detection Camera
            </h1>
            <p className="text-purple-200">
              Detect motion through walls using WiFi and Bluetooth RF signals
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={isRunning ? handleStop : handleStart}
              variant={isRunning ? "destructive" : "default"}
              size="lg"
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Square className="w-5 h-5" />
                  Stop Detection
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Detection
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <Card className="lg:col-span-2 bg-slate-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Camera className="w-5 h-5" />
                Camera Feed
              </CardTitle>
              <CardDescription className="text-purple-200">
                Real-time visual monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                {!isRunning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                    <p className="text-purple-200">Camera inactive</p>
                  </div>
                )}
                {latestResult?.isMotionDetected && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="destructive" className="animate-pulse">
                      Motion Detected
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Control Panel */}
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5" />
                Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sensor Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-purple-400" />
                    <span className="text-white">WiFi CSI</span>
                  </div>
                  <Switch
                    checked={wifiEnabled}
                    onCheckedChange={setWifiEnabled}
                    disabled={isRunning}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bluetooth className="w-4 h-4 text-blue-400" />
                    <span className="text-white">Bluetooth RSSI</span>
                  </div>
                  <Switch
                    checked={bluetoothEnabled}
                    onCheckedChange={setBluetoothEnabled}
                    disabled={isRunning}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-green-400" />
                    <span className="text-white">Camera</span>
                  </div>
                  <Switch
                    checked={cameraEnabled}
                    onCheckedChange={setCameraEnabled}
                    disabled={isRunning}
                  />
                </div>
              </div>

              {/* Sensitivity Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">Sensitivity</span>
                  <span className="text-purple-300 text-sm">{sensitivity[0]}%</span>
                </div>
                <Slider
                  value={sensitivity}
                  onValueChange={handleSensitivityChange}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Status Indicators */}
              <div className="space-y-2 pt-4 border-t border-purple-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-purple-200 text-sm">WiFi Status</span>
                  <Badge variant={wifiEnabled ? "default" : "secondary"}>
                    {wifiEnabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-200 text-sm">Bluetooth Status</span>
                  <Badge variant={bluetoothEnabled ? "default" : "secondary"}>
                    {bluetoothEnabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-200 text-sm">Camera Status</span>
                  <Badge variant={cameraEnabled ? "default" : "secondary"}>
                    {cameraEnabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signal Monitoring */}
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Signal className="w-5 h-5" />
                Signal Monitoring
              </CardTitle>
              <CardDescription className="text-purple-200">
                Real-time RF signal analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="wifi" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="wifi">WiFi</TabsTrigger>
                  <TabsTrigger value="bluetooth">Bluetooth</TabsTrigger>
                </TabsList>
                <TabsContent value="wifi" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-200">Signal Quality</span>
                      <span className="text-white">{latestResult ? Math.round(latestResult.confidence) : 0}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-300"
                        style={{ width: `${latestResult ? latestResult.confidence : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-200">CSI Amplitude</span>
                      <span className="text-white">
                        {wifiMotionService.getCSIHistory().length > 0 
                          ? wifiMotionService.getCSIHistory()[wifiMotionService.getCSIHistory().length - 1].amplitude.toFixed(3)
                          : '0.000'}
                      </span>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="bluetooth" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-200">Devices Detected</span>
                      <span className="text-white">{bluetoothMotionService.getAllDevices().length}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-200">Avg RSSI</span>
                      <span className="text-white">
                        {bluetoothMotionService.getAllDevices().length > 0
                          ? Math.round(
                              bluetoothMotionService.getAllDevices().reduce((sum, d) => sum + d.rssi, 0) /
                              bluetoothMotionService.getAllDevices().length
                            ) + ' dBm'
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Motion Detection Results */}
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="w-5 h-5" />
                Motion Detection
              </CardTitle>
              <CardDescription className="text-purple-200">
                Analysis results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <div className="text-purple-200 text-sm mb-1">Total Detections</div>
                  <div className="text-2xl font-bold text-white">{statistics.totalDetections}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <div className="text-purple-200 text-sm mb-1">Through-Wall</div>
                  <div className="text-2xl font-bold text-white">{statistics.throughWallDetections}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <div className="text-purple-200 text-sm mb-1">Avg Confidence</div>
                  <div className="text-2xl font-bold text-white">{Math.round(statistics.averageConfidence)}%</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <div className="text-purple-200 text-sm mb-1">Detection Rate</div>
                  <div className="text-2xl font-bold text-white">
                    {statistics.totalDetections > 0 
                      ? Math.round((statistics.throughWallDetections / statistics.totalDetections) * 100) 
                      : 0}%
                  </div>
                </div>
              </div>

              {/* Source Breakdown */}
              <div className="space-y-2 pt-4 border-t border-purple-500/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-200">WiFi Detections</span>
                  <span className="text-white">{statistics.bySource.wifi}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-200">Bluetooth Detections</span>
                  <span className="text-white">{statistics.bySource.bluetooth}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-200">Camera Detections</span>
                  <span className="text-white">{statistics.bySource.camera}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Through-Wall Detection */}
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5" />
                Through-Wall Detection
              </CardTitle>
              <CardDescription className="text-purple-200">
                Wall penetration analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestResult?.wallPenetration.detected ? (
                <Alert className="bg-orange-500/20 border-orange-500/50">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                  <AlertTitle className="text-orange-200">Motion Detected Through Wall</AlertTitle>
                  <AlertDescription className="text-orange-100">
                    Material: {latestResult.wallPenetration.material}<br />
                    Confidence: {Math.round(latestResult.wallPenetration.confidence)}%
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-purple-200">No through-wall motion detected</p>
                </div>
              )}

              {latestResult && (
                <div className="space-y-2 pt-4 border-t border-purple-500/30">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-200">Estimated Location:</span>
                  </div>
                  <div className="text-white ml-6">
                    X: {latestResult.location.x.toFixed(2)}m, Y: {latestResult.location.y.toFixed(2)}m
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Signal className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-200">Distance:</span>
                  </div>
                  <div className="text-white ml-6">
                    {latestResult.location.estimatedDistance.toFixed(2)}m
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        {alerts.length > 0 && (
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="w-5 h-5" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map((alert, index) => (
                  <Alert key={index} className="bg-red-500/20 border-red-500/50">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertTitle className="text-red-200">
                      Motion Detected - {alert.wallPenetration.material}
                    </AlertTitle>
                    <AlertDescription className="text-red-100">
                      {alert.detectedAt.toLocaleTimeString()} - Confidence: {Math.round(alert.confidence)}%
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MotionDetectionPage;
