import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

export default function SelectionAssistant() {
  const [selectionInfo, setSelectionInfo] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseUp = (e) => {
      // Small timeout to let the browser finish the selection
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        // If no text or very little text is selected, or if we are clicking inside our own button, hide the button
        if (!text || text.length < 2) {
          setSelectionInfo(null);
          return;
        }

        // Don't show if the selection is inside an input or textarea
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          setSelectionInfo(null);
          return;
        }

        // Make sure we have a valid range
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Calculate a position slightly above the center of the selection
          setSelectionInfo({
            text,
            top: rect.top + window.scrollY - 40,
            left: rect.left + window.scrollX + (rect.width / 2)
          });
        }
      }, 10);
    };

    // Also clear on mousedown if it's not on our popup
    const handleMouseDown = (e) => {
      if (containerRef.current && containerRef.current.contains(e.target)) {
        return; // clicking on the popup itself
      }
      setSelectionInfo(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    // Hide when scrolling for a better UX
    document.addEventListener('scroll', () => setSelectionInfo(null));

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('scroll', () => setSelectionInfo(null));
    };
  }, []);

  const handleAskAI = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (selectionInfo && selectionInfo.text) {
      // Dispatch custom event that ChatAssistant will listen for
      const event = new CustomEvent('ask-ai-query', { 
        detail: { query: `Can you explain what "${selectionInfo.text}" means in this context?` } 
      });
      window.dispatchEvent(event);
      
      // Clear the browser selection
      window.getSelection().removeAllRanges();
      setSelectionInfo(null);
    }
  };

  if (!selectionInfo) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-[200] animate-bounce-in"
      style={{
        top: `${selectionInfo.top}px`,
        left: `${selectionInfo.left}px`,
        transform: 'translateX(-50%)'
      }}
    >
      <button
        onClick={handleAskAI}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-full shadow-lg shadow-blue-500/20 border border-blue-400 transition-colors btn-press pointer-events-auto"
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-200" />
        Ask AI
      </button>
      {/* Little tail pointing down */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-t-4 border-t-blue-600 border-x-4 border-x-transparent w-0 h-0"></div>
    </div>
  );
}
