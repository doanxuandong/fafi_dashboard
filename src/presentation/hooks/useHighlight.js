import { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

export const useHighlight = (itemId, category) => {
  const { highlightedItem, clearHighlight } = useNotifications();
  
  const isHighlighted = highlightedItem?.itemId === itemId && highlightedItem?.category === category;
  
  useEffect(() => {
    if (isHighlighted) {
      // Scroll to element if it's highlighted
      const element = document.getElementById(`item-${itemId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isHighlighted, itemId]);
  
  return {
    isHighlighted,
    clearHighlight
  };
};
