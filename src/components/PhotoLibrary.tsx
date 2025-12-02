import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUploadCloud, FiImage, FiCheck } from 'react-icons/fi';
import { useBlog } from '../contexts/BlogContext';

interface PhotoLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (imageSrc: string) => void;
}

const PhotoLibrary: React.FC<PhotoLibraryProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const { t } = useTranslation();
  const { uploadImage } = useBlog(); // Use the real upload function
  
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // In a full production app, you would fetch this list from GET /api/user/images
  // For now, we persist uploads in the session so the user can reuse them
  const [sessionImages, setSessionImages] = useState<string[]>([]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsUploading(false);
    }
  }, [isOpen]);

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t('photoLibrary.error.invalidType', 'Please upload an image file (JPG, PNG, WEBP)'));
      return;
    }

    // Validate size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('photoLibrary.error.tooLarge', 'Image must be smaller than 5MB'));
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      const imageUrl = await uploadImage(file);
      
      // Add to local session history
      setSessionImages(prev => [imageUrl, ...prev]);
      
      // Auto-insert if it's a direct upload action
      onInsert(imageUrl);
      
    } catch (err) {
      console.error(err);
      setError(t('photoLibrary.error.uploadFailed', 'Failed to upload image. Please try again.'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="font-semibold text-lg">{t('photoLibrary.title', 'Insert Image')}</h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 px-4">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'upload' 
                      ? 'border-black text-black' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('photoLibrary.upload', 'Upload New')}
                </button>
                <button
                  onClick={() => setActiveTab('library')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'library' 
                      ? 'border-black text-black' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('photoLibrary.library', 'Recent Uploads')}
                  {sessionImages.length > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                      {sessionImages.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto min-h-[300px]">
                {activeTab === 'upload' && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`
                      border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center text-center p-8 transition-colors
                      ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                    `}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center animate-pulse">
                        <FiUploadCloud className="w-12 h-12 text-blue-500 mb-4" />
                        <p className="text-gray-900 font-medium">{t('photoLibrary.uploading', 'Uploading...')}</p>
                        <p className="text-gray-500 text-sm">{t('photoLibrary.pleaseWait', 'Optimizing your image')}</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <FiImage className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-900 font-medium mb-1">
                          {t('photoLibrary.dragDrop', 'Click or drag image to upload')}
                        </p>
                        <p className="text-gray-500 text-sm mb-6">
                          JPG, PNG, WEBP up to 5MB
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition-transform active:scale-95"
                        >
                          {t('photoLibrary.selectFile', 'Select File')}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'library' && (
                  <div>
                    {sessionImages.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FiImage className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500">{t('photoLibrary.noImages', 'No images uploaded in this session')}</p>
                        <button 
                          onClick={() => setActiveTab('upload')}
                          className="mt-4 text-blue-600 font-medium hover:underline"
                        >
                          {t('photoLibrary.uploadOne', 'Upload one now')}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {sessionImages.map((src, index) => (
                          <div 
                            key={index}
                            onClick={() => onInsert(src)}
                            className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-gray-100 hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 transition-all"
                          >
                            <img src={src} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1.5 rounded-full text-blue-600 shadow-sm">
                              <FiCheck className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <FiX className="shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PhotoLibrary;