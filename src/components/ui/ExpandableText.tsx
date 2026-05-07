import React, { useRef, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { MoreHorizontal } from 'lucide-react';

interface Props {
  text: string;
  className?: string;
  lineClamp?: 1 | 2 | 3 | 4;
}

export function ExpandableText({ text, className, lineClamp = 3 }: Props) {
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        // Compare full height to clamped height
        const { scrollHeight, clientHeight } = textRef.current;
        setIsTruncated(scrollHeight > clientHeight);
      }
    };

    checkTruncation();
    // Re-check on resize
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [text, lineClamp]);

  const lineClampClass = {
    1: "line-clamp-1",
    2: "line-clamp-2",
    3: "line-clamp-3",
    4: "line-clamp-4"
  }[lineClamp];

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
      // If we're interacting with the text to expand it, or selecting it,
      // stop propagation so parent buttons don't fire.
      e.stopPropagation();
  };

  return (
    <div className={cn("relative group/text", className)} onClick={handleInteraction}>
      <div 
        ref={textRef}
        tabIndex={0}
        className={cn(
          "transition-all duration-300 outline-none cursor-pointer md:cursor-auto",
          `${lineClampClass} hover:line-clamp-none focus:line-clamp-none active:line-clamp-none md:group-hover/text:line-clamp-none peer`
        )}
      >
        {text}
      </div>
      
      {/* Subtle fade hint for truncated text */}
      {isTruncated && (
        <div className="absolute -bottom-1 -left-1 rtl:-right-1 rtl:left-auto flex items-center justify-center pointer-events-none opacity-40 md:group-hover/text:opacity-0 peer-hover:opacity-0 peer-focus:opacity-0 peer-active:opacity-0 transition-opacity duration-300">
           <MoreHorizontal className="w-3.5 h-3.5 text-zinc-500" />
        </div>
      )}
    </div>
  );
}
