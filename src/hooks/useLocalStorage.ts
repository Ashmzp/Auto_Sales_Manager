
import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const valueToStore = storedValue;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
        // Potentially display a toast to the user if storage is full or saving fails.
        // For now, just logging.
      }
    }
  }, [key, storedValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
        setStoredValue(prevValue => {
            const newValue = value instanceof Function ? value(prevValue) : value;
            return newValue;
        });
    } catch (error) {
        console.error(`Error during setValue for localStorage key "${key}":`, error);
    }
  }, [key]); // key added to dependencies for completeness, though setStoredValue itself is stable

  return [storedValue, setValue];
}

export default useLocalStorage;
