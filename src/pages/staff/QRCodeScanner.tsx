// src/pages/staff/QRCodeScanner.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const QR_CODE_SCANNER_ID = 'qr-code-reader';

interface QRCodeScannerPageProps {}

const getActiveMealType = (): 'breakfast' | 'lunch' | 'dinner' | null => {
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 7 && hour < 10) return 'breakfast';
  if (hour >= 12 && hour < 15) return 'lunch';
  if (hour >= 19 && hour < 22) return 'dinner';
  return null;
};

const StaffQRCodeScannerPage: React.FC<QRCodeScannerPageProps> = () => {
  const { user } = useAuth();
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'auto'>('auto');

  // Stop camera stream safely
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
          console.log('QR scanner stream stopped.');
        }
        // Clear HTML only on explicit stop, not on unmount
      } catch (err: any) {
        console.error('Error stopping QR scanner:', err);
      } finally {
        html5QrCodeRef.current = null;
        setIsScanning(false);
      }
    }
  }, []);

  // Get camera device ID (prefer back/rear camera)
  const getCameraId = useCallback(async (): Promise<string | null> => {
    try {
      const devices: CameraDevice[] = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        return null;
      }
      // Find rear/back camera by label if possible
      const backCamera = devices.find(device =>
        /back|rear|environment/i.test(device.label)
      );
      return backCamera ? backCamera.id : devices[0].id;
    } catch (e) {
      console.warn('Error fetching cameras:', e);
      return null;
    }
  }, []);

  // Initialize scanner & start scanning
  const initializeScanner = useCallback(async () => {
    if (isScanning || html5QrCodeRef.current || !user) return;

    const autoMealType = getActiveMealType();
    const currentMealType = selectedMealType === 'auto' ? autoMealType : selectedMealType;

    if (!currentMealType) {
      setScanError('No active meal time detected. Please select meal type manually.');
      setIsScanning(false);
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setScanError(null);
    setCameraPermissionError(null);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    };

    // Check container element presence
    const container = document.getElementById(QR_CODE_SCANNER_ID);
    if (!container) {
      setScanError('QR code scanner container not found.');
      setIsScanning(false);
      return;
    }

    html5QrCodeRef.current = new Html5Qrcode(QR_CODE_SCANNER_ID);

    try {
      const cameraId = await getCameraId();

      if (!cameraId) {
        setCameraPermissionError('No suitable camera found on this device.');
        setIsScanning(false);
        return;
      }

      await html5QrCodeRef.current.start(
        cameraId,
        config,
        async (decodedText: string) => {
          await stopCamera(); // Stop immediately on scan

          if (!user) {
            toast.error('Authentication required to mark attendance.');
            return;
          }

          const token = localStorage.getItem('token');
          if (!token) {
            toast.error('Authentication token missing. Please log in.');
            return;
          }

          setScanResult(`Scanned: ${decodedText}`);

          try {
            const response = await axios.post(
              '/api/staff/attendance/mark-qr',
              { studentUserId: decodedText, mealType: currentMealType },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
              toast.success(response.data.message || `Attendance marked for ${currentMealType}!`);
            } else {
              toast.error(response.data.message || 'Failed to mark attendance.');
            }
          } catch (err: any) {
            console.error('Attendance marking error:', err);
            toast.error(err.response?.data?.message || err.message || 'Error marking attendance.');
          }
        },
        (errorMessage) => {
          // Optional scan failure callback - silent or add logs if needed
          // console.warn('QR scan error:', errorMessage);
        }
      );
      console.log('QR scanner started with camera ID:', cameraId);
    } catch (err: any) {
      setIsScanning(false);
      html5QrCodeRef.current = null;
      console.error('Error starting QR scanner:', err);

      if (err.message.includes('permission denied')) {
        setCameraPermissionError('Camera permission denied. Please allow camera access.');
      } else if (err.message.includes('No cameras with desired capabilities')) {
        setCameraPermissionError('No camera found. Please connect a camera.');
      } else {
        setCameraPermissionError(`Failed to start camera: ${err.message}`);
      }
    }
  }, [getCameraId, isScanning, selectedMealType, stopCamera, user]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount - stop stream but do NOT call clear() here
      stopCamera();
    };
  }, [stopCamera]);

  // Explicit stop triggered by user button
  const handleStopScan = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
          console.log('QR scanner stopped via button.');
        }

        // Clear QR scanner HTML elements safely only if container still exists
        const container = document.getElementById(QR_CODE_SCANNER_ID);
        if (container && container.children.length > 0) {
          await html5QrCodeRef.current.clear();
          console.log('QR scanner HTML cleared.');
        } else {
          console.warn('QR scanner container missing or already cleared.');
        }
      } catch (err: any) {
        console.error('Error stopping/clearing QR scanner:', err);
      } finally {
        html5QrCodeRef.current = null;
        setIsScanning(false);
        setScanResult(null);
        setScanError(null);
        setCameraPermissionError(null);
      }
    }
  }, []);

  const handleStartScan = () => {
    setCameraPermissionError(null);
    setScanError(null);
    initializeScanner();
  };

  return (
    <Layout title="QR Code Scanner">
      <div className="container mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">QR Code Attendance Scanner</h2>

        {cameraPermissionError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <strong className="font-bold">Camera Error!</strong> <span>{cameraPermissionError}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <label htmlFor="meal-type-select" className="text-gray-700 font-medium">
            Select Meal Type:
          </label>
          <select
            id="meal-type-select"
            className="form-select mt-1 block w-full md:w-auto p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={selectedMealType}
            onChange={(e) => setSelectedMealType(e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'auto')}
            disabled={isScanning}
          >
            <option value="auto">Auto-detect (Current Time)</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>

          <button
            onClick={handleStartScan}
            disabled={isScanning}
            className={`px-6 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-full md:w-auto ${
              isScanning ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isScanning ? 'Scanning...' : 'Start Scan'}
          </button>

          <button
            onClick={handleStopScan}
            disabled={!isScanning}
            className={`px-6 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 w-full md:w-auto ${
              !isScanning ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            Stop Scan
          </button>
        </div>

        {scanResult && (
          <p className="text-green-700 font-semibold mb-4">Result: {scanResult}</p>
        )}

        {scanError && (
          <p className="text-red-700 font-semibold mb-4">Error: {scanError}</p>
        )}

        {/* QR Code scanner will be rendered inside this div */}
        <div id={QR_CODE_SCANNER_ID} className="w-full max-w-md mx-auto" />

      </div>
    </Layout>
  );
};

export default StaffQRCodeScannerPage;
