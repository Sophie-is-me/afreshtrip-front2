import { useEffect, useRef, type ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

const BottomSheet = ({
  isOpen,
  onClose,
  children,
  title
}: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.drag-handle-area')) {
        isDragging.current = true;
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || !sheetRef.current) return;
      
      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;
      
      if (deltaY > 0) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging.current || !sheetRef.current) return;
      
      const deltaY = currentY.current - startY.current;
      
      if (deltaY > 100) {
        onClose();
      } else {
        sheetRef.current.style.transform = 'translateY(0)';
      }
      
      isDragging.current = false;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl z-50 md:hidden ${
          isOpen ? 'animate-slide-up' : ''
        }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Drag Handle */}
        <div className="drag-handle-area flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
          <div className="drag-handle" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full smooth-transition"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomSheet;