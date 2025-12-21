import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isOpen: boolean;
  onClose: () => void;
  stayOpen?: boolean;
}

export function BarcodeScanner({ onScan, isOpen, onClose, stayOpen = false }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startScanner();
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          handleClose();
        }
      };
      window.addEventListener('keydown', handleKey, true);
      return () => {
        window.removeEventListener('keydown', handleKey, true);
      };
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const startScanner = async () => {
    try {
      setError(null);
      const scanner = new Html5Qrcode('barcode-scanner');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        () => {
          // Ignore scan errors
        }
      );
    } catch (err) {
      setError('Camera access denied or not available');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch {
        // Ignore stop errors
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }
      }}
    >
      <Card className="w-full max-w-md relative">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              <span className="font-medium">Scan Barcode</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              className="rounded-xl h-10 w-10 z-10 relative"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={startScanner}>Try Again</Button>
            </div>
          ) : (
            <div id="barcode-scanner" className="w-full aspect-video bg-muted" />
          )}
          
          <p className="text-sm text-muted-foreground text-center mt-4">
            Point the camera at a barcode
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
