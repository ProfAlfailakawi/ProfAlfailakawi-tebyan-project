import { useState, useCallback, useRef } from 'react';

export function useRequestQueue() {
  const [isProcessing, setIsProcessing] = useState(false);
  const queue = useRef<(() => Promise<any>)[]>([]);

  const addToQueue = useCallback(<T>(request: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      queue.current.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      processQueue();
    });
  }, []);

  const processQueue = async () => {
    if (isProcessing || queue.current.length === 0) return;
    setIsProcessing(true);
    const nextRequest = queue.current.shift();
    if (nextRequest) await nextRequest();
    setIsProcessing(false);
    processQueue();
  };

  return { addToQueue, isProcessing };
}
