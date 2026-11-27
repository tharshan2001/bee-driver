import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/** How much of the screen the keyboard covers; 0 when it is closed. */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', (e) => setHeight(Math.max(0, e.endCoordinates.height))); // a floating keyboard can report below 0
    const hidden = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => { shown.remove(); hidden.remove(); };
  }, []);
  return height;
}
