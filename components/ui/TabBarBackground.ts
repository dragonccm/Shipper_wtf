import { useState } from 'react';

export function useBottomTabOverflow() {
  const [bottomOverflow, setBottomOverflow] = useState(0);

  // Logic to calculate bottom overflow
  // You can replace this with actual logic
  const calculateOverflow = () => {
    // Example logic
    setBottomOverflow(50);
  };

  return bottomOverflow;
}