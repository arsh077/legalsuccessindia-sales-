
import React, { useState, useEffect, useRef } from 'react';

interface EyeProps {
  size: number;
  pupilSize: number;
  mouseX: number;
  mouseY: number;
  parentRef: React.RefObject<HTMLDivElement | null>;
  isBlinking: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall: React.FC<EyeProps> = ({ size, pupilSize, mouseX, mouseY, parentRef, isBlinking, forceLookX, forceLookY }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (forceLookX !== undefined && forceLookY !== undefined) {
      setPos({ x: forceLookX, y: forceLookY });
      return;
    }

    if (parentRef.current) {
      const rect = parentRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), size / 3);
      const angle = Math.atan2(dy, dx);
      setPos({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
    }
  }, [mouseX, mouseY, forceLookX, forceLookY, size, parentRef]);

  return (
    <div 
      className="bg-white rounded-full flex items-center justify-center overflow-hidden transition-all duration-150"
      style={{ width: size, height: isBlinking ? 2 : size }}
    >
      {!isBlinking && (
        <div 
          className="bg-gray-900 rounded-full"
          style={{ 
            width: pupilSize, 
            height: pupilSize, 
            transform: `translate(${pos.x}px, ${pos.y}px)` 
          }}
        />
      )}
    </div>
  );
};

export const AdvocateAnimation: React.FC<{ isTyping: boolean; isTypingPassword?: boolean; showPassword?: boolean }> = ({ isTyping, isTypingPassword, showPassword }) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [blinks, setBlinks] = useState([false, false]); // [Character1, Character2]
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useEffect(() => {
    const blink = (idx: number) => {
      setBlinks(prev => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      setTimeout(() => setBlinks(prev => {
        const next = [...prev];
        next[idx] = false;
        return next;
      }), 150);
    };

    const i1 = setInterval(() => blink(0), 4000 + Math.random() * 3000);
    const i2 = setInterval(() => blink(1), 3500 + Math.random() * 2500);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, []);

  const getPos = (baseX: number) => {
    const dx = (mouse.x - (window.innerWidth / 4)) / 50;
    return Math.max(-15, Math.min(15, dx));
  };

  return (
    <div ref={containerRef} className="relative w-full h-[500px] flex items-end justify-center overflow-hidden">
      {/* Advocate 1: The Senior Counsel (Tall Rectangle) */}
      <div 
        className="absolute bottom-0 w-44 bg-gray-900 rounded-t-3xl transition-all duration-700 ease-in-out z-10"
        style={{ 
          left: '15%', 
          height: isTypingPassword && !showPassword ? 460 : 420,
          transform: `skewX(${getPos(15)}deg) ${isTypingPassword && showPassword ? 'translateX(20px)' : ''}`,
          transformOrigin: 'bottom'
        }}
      >
        {/* Lawyer Bands/Collar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-16 bg-white rounded-b-lg flex flex-col items-center">
            <div className="w-1 h-12 bg-gray-100 flex gap-2">
                <div className="w-2 h-12 bg-white border-r border-gray-100"></div>
                <div className="w-2 h-12 bg-white"></div>
            </div>
        </div>
        
        <div className="absolute top-24 left-1/2 -translate-x-1/2 flex gap-8">
          <div ref={useRef(null)}><EyeBall size={20} pupilSize={8} mouseX={mouse.x} mouseY={mouse.y} parentRef={containerRef} isBlinking={blinks[0]} forceLookX={isTypingPassword && showPassword ? 6 : undefined} /></div>
          <div ref={useRef(null)}><EyeBall size={20} pupilSize={8} mouseX={mouse.x} mouseY={mouse.y} parentRef={containerRef} isBlinking={blinks[0]} forceLookX={isTypingPassword && showPassword ? 6 : undefined} /></div>
        </div>
      </div>

      {/* Advocate 2: The Judge (Semi-circle) */}
      <div 
        className="absolute bottom-0 w-60 bg-orange-500 rounded-t-full transition-all duration-500 z-20"
        style={{ 
          left: '5%', 
          height: 220,
          transform: `skewX(${getPos(5) * 0.5}deg)`,
          transformOrigin: 'bottom'
        }}
      >
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-10">
          <div className="w-3 h-3 bg-gray-900 rounded-full opacity-80" style={{ transform: `translate(${getPos(5)}px, 0)` }}></div>
          <div className="w-3 h-3 bg-gray-900 rounded-full opacity-80" style={{ transform: `translate(${getPos(5)}px, 0)` }}></div>
        </div>
      </div>

      {/* Advocate 3: The Junior Associate (Yellow) */}
      <div 
        className="absolute bottom-0 w-36 bg-yellow-400 rounded-t-[50px] transition-all duration-700 z-30 shadow-2xl"
        style={{ 
          left: '45%', 
          height: 280,
          transform: `skewX(${getPos(45)}deg) ${isTypingPassword ? 'translateX(-30px)' : ''}`,
          transformOrigin: 'bottom'
        }}
      >
        {/* Associate Tie */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-12 bg-white rounded-b-md flex justify-center">
            <div className="w-1 h-8 bg-indigo-600 mt-2 rounded-full"></div>
        </div>
        
        <div className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-6">
          <div ref={useRef(null)}><EyeBall size={18} pupilSize={7} mouseX={mouse.x} mouseY={mouse.y} parentRef={containerRef} isBlinking={blinks[1]} forceLookX={isTypingPassword ? -5 : undefined} /></div>
          <div ref={useRef(null)}><EyeBall size={18} pupilSize={7} mouseX={mouse.x} mouseY={mouse.y} parentRef={containerRef} isBlinking={blinks[1]} forceLookX={isTypingPassword ? -5 : undefined} /></div>
        </div>
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-900/20 rounded-full"></div>
      </div>
    </div>
  );
};
