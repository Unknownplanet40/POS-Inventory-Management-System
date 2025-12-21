import { useEffect, useRef, useCallback } from 'react';

interface UseScannerGunProps {
  onScan: (barcode: string) => void;
  onScannerDetected?: () => void;
  enabled?: boolean;
}

export function useScannerGun({ onScan, onScannerDetected, enabled = true }: UseScannerGunProps) {
  const scannerBufferRef = useRef<string>('');
  const scannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scannerDetectedRef = useRef<boolean>(false);
  const SCANNER_TIMEOUT = 100;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' && target.id !== 'barcode-input' && target.id !== 'barcode-field';
      const isTextarea = target.tagName === 'TEXTAREA';

      if (isInputField || isTextarea) {
        return;
      }

      if (event.key === 'Enter') {
        if (scannerBufferRef.current.length > 0) {
          event.preventDefault();
          
          if (!scannerDetectedRef.current && onScannerDetected) {
            scannerDetectedRef.current = true;
            onScannerDetected();
          }
          
          onScan(scannerBufferRef.current);
          scannerBufferRef.current = '';
          if (scannerTimeoutRef.current) {
            clearTimeout(scannerTimeoutRef.current);
          }
        }
        return;
      }

      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        scannerBufferRef.current += event.key;

        if (scannerTimeoutRef.current) {
          clearTimeout(scannerTimeoutRef.current);
        }

        scannerTimeoutRef.current = setTimeout(() => {
          if (scannerBufferRef.current.length > 0) {
            onScan(scannerBufferRef.current);
            scannerBufferRef.current = '';
          }
        }, SCANNER_TIMEOUT);
      }
    },
    [onScan, onScannerDetected, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);

  return {
    scannerBuffer: scannerBufferRef.current,
  };
}
