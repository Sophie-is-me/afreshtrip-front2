import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSettings, FiArrowLeft, FiImage, FiX, FiCheck, FiGlobe, FiLock } from 'react-icons/fi';
// import { useAuth } from '../contexts/AuthContext';
import { useBlog } from '../contexts/BlogContext';
import { useDebounce } from '../hooks/useDebounce';
import FeatureGate from '../components/FeatureGate';
import { FeatureId } from '../types/features';
import PhotoLibrary from '../components/PhotoLibrary';

// --- TIPTAP V3 IMPORTS ---
import { useEditor, EditorContent } from '@tiptap/react';
// 1. Correct Import for v3 UI Component
import { BubbleMenu } from '@tiptap/react/menus';
// 2. Extensions
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';

interface BlogFormValues {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  featuredImage: string | null;
  isPublished: boolean;
}

const BlogEditor: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  // const { user } = useAuth();
  const { createBlogPost, updateBlogPost, getBlogPostById } = useBlog();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPhotoLibraryOpen, setIsPhotoLibraryOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [postId, setPostId] = useState<string | null>(null);
  
  const { 
    register, 
    control, 
    handleSubmit, 
    watch, 
    setValue, 
    reset,
    getValues,
    formState: { isDirty }
  } = useForm<BlogFormValues>({
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      category: 'Travel',
      tags: [],
      featuredImage: null,
      isPublished: false
    }
  });

  const watchedValues = watch();
  const debouncedValues = useDebounce(watchedValues, 2000);

  // --- TIPTAP CONFIGURATION ---
  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: t('blog.contentPlaceholder', 'Tell your story...'),
      }),
      // Register the extension logic
      BubbleMenuExtension, 
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setValue('content', editor.getHTML(), { shouldDirty: true });
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[50vh] outline-none',
      },
    },
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editId = searchParams.get('edit');

    if (editId) {
      setPostId(editId);
      const loadPost = async () => {
        try {
          const post = await getBlogPostById(editId);
          if (post) {
            reset({
              title: post.title,
              content: post.content,
              excerpt: post.excerpt || '',
              category: post.category,
              tags: post.tags || [],
              featuredImage: post.images?.[0] || null,
              isPublished: post.isPublished
            });
            // Safe content set
            if (editor && !editor.isDestroyed) {
              editor.commands.setContent(post.content);
            }
          }
        } catch (error) {
          console.error('Error loading post:', error);
        }
      };
      loadPost();
    }
  }, [location.search, getBlogPostById, reset, editor]);

  // --- AUTO-SAVE LOGIC ---
  useEffect(() => {
    if (!isDirty || !postId) return;

    const autoSave = async () => {
      setSaveStatus('saving');
      try {
        const updates = {
          title: debouncedValues.title,
          content: debouncedValues.content,
          excerpt: debouncedValues.excerpt,
          tags: debouncedValues.tags,
          category: debouncedValues.category,
          images: debouncedValues.featuredImage ? [debouncedValues.featuredImage] : [],
          isPublished: debouncedValues.isPublished,
        };

        await updateBlogPost(postId, updates);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Auto-save failed', error);
        setSaveStatus('error');
      }
    };

    autoSave();
  }, [debouncedValues, postId, isDirty, updateBlogPost]);

  // --- HANDLERS ---
  const onSubmit = async (data: BlogFormValues) => {
    if (!data.title.trim()) {
        alert(t('blog.titleRequired'));
        return;
    }

    setSaveStatus('saving');
    try {
      const payload = {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        category: data.category,
        tags: data.tags,
        images: data.featuredImage ? [data.featuredImage] : [],
        isPublished: data.isPublished
      };

      if (postId) {
        await updateBlogPost(postId, payload);
        setSaveStatus('saved');
      } else {
        const newId = await createBlogPost(payload);
        setPostId(newId);
        window.history.replaceState(null, '', `?edit=${newId}`);
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
    }
  };

  const handlePublishToggle = () => {
    const newValue = !getValues('isPublished');
    setValue('isPublished', newValue, { shouldDirty: true });
    // Force immediate save for critical state changes
    if(postId) {
        updateBlogPost(postId, { isPublished: newValue });
    }
  };

  const insertImageFromLibrary = (src: string) => {
    if (isSidebarOpen) {
      setValue('featuredImage', src, { shouldDirty: true });
    } 
    else if (editor) {
      editor.chain().focus().setImage({ src }).run();
    }
    setIsPhotoLibraryOpen(false);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentTags: string[], onChange: (tags: string[]) => void) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val && !currentTags.includes(val)) {
        onChange([...currentTags, val]);
        e.currentTarget.value = '';
      }
    }
  };

  return (
    <FeatureGate feature={FeatureId.BLOG_PUBLISHING}>
      <div className="min-h-screen bg-white flex flex-col">
        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {watch('title') || t('blog.untitled')}
              </span>
              <div className="flex items-center gap-2 text-xs">
                {saveStatus === 'saving' && <span className="text-blue-600 animate-pulse">{t('blog.saving')}...</span>}
                {saveStatus === 'saved' && <span className="text-green-600 flex items-center gap-1"><FiCheck /> {t('blog.saved')}</span>}
                {saveStatus === 'error' && <span className="text-red-600">{t('blog.errorSaving')}</span>}
                {saveStatus === 'idle' && <span className="text-gray-400">{isDirty ? t('blog.unsavedChanges') : t('blog.uptodate')}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button
              onClick={handlePublishToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                watch('isPublished') 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {watch('isPublished') ? <FiGlobe /> : <FiLock />}
              {watch('isPublished') ? t('blog.published') : t('blog.draft')}
            </button>

            <button
              onClick={handleSubmit(onSubmit)}
              className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-transform active:scale-95"
            >
              {saveStatus === 'saving' ? t('blog.saving') : t('blog.save')}
            </button>
            
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-full transition-colors ${isSidebarOpen ? 'bg-gray-100 text-black' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <FiSettings className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* EDITOR */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 flex relative">
          <div className="w-full">
            <input
              {...register('title')}
              placeholder={t('blog.titlePlaceholder', 'Article Title')}
              className="w-full text-4xl md:text-5xl font-bold placeholder-gray-300 border-none outline-none focus:ring-0 bg-transparent mb-8"
              autoFocus
            />

            {watch('featuredImage') && !isSidebarOpen && (
              <div className="relative w-full h-64 md:h-96 mb-8 rounded-xl overflow-hidden group">
                <img 
                  src={watch('featuredImage')!} 
                  alt="Cover" 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}

            {/* V3 BUBBLE MENU */}
            {editor && (
              <BubbleMenu 
                editor={editor} 
                className="bg-white shadow-xl border border-gray-100 rounded-lg overflow-hidden flex divide-x divide-gray-100"
              >
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 hover:bg-gray-50 ${editor.isActive('bold') ? 'text-blue-600' : 'text-gray-600'}`}
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-2 hover:bg-gray-50 ${editor.isActive('italic') ? 'text-blue-600' : 'text-gray-600'}`}
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`p-2 hover:bg-gray-50 ${editor.isActive('heading', { level: 2 }) ? 'text-blue-600' : 'text-gray-600'}`}
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false); 
                    setIsPhotoLibraryOpen(true);
                  }}
                  className="p-2 hover:bg-gray-50 text-gray-600"
                >
                  <FiImage />
                </button>
              </BubbleMenu>
            )}

            <EditorContent editor={editor} />
          </div>
        </main>

        {/* SIDEBAR */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/20 z-40 backdrop-blur-xs"
              />
              
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-80 md:w-96 bg-white shadow-2xl z-50 overflow-y-auto border-l border-gray-100"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-lg font-semibold">{t('blog.postSettings')}</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                      <FiX />
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('blog.featuredImage')}</label>
                      <div 
                        onClick={() => setIsPhotoLibraryOpen(true)}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        {watch('featuredImage') ? (
                          <div className="relative">
                             <img src={watch('featuredImage')!} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setValue('featuredImage', null, { shouldDirty: true });
                               }}
                               className="absolute top-2 right-2 bg-white/90 p-1 rounded-full text-red-600 hover:bg-white"
                             >
                               <FiX />
                             </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-gray-500">
                            <FiImage className="w-8 h-8 mb-2" />
                            <span className="text-sm">{t('blog.addCover')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('blog.excerpt')}</label>
                      <textarea
                        {...register('excerpt')}
                        rows={4}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder={t('blog.excerptHint')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('blog.category')}</label>
                      <select
                        {...register('category')}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                      >
                        <option value="Travel">{t('blog.travel')}</option>
                        <option value="Food">{t('blog.food')}</option>
                        <option value="Lifestyle">{t('blog.lifestyle')}</option>
                        <option value="Tech">{t('blog.tech')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('blog.tags')}</label>
                      <Controller
                        name="tags"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {value.map(tag => (
                                <span key={tag} className="bg-white border border-gray-200 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                                  {tag}
                                  <button onClick={() => onChange(value.filter(t => t !== tag))} className="hover:text-red-500"><FiX /></button>
                                </span>
                              ))}
                            </div>
                            <input
                              type="text"
                              placeholder={t('blog.addTags')}
                              className="w-full bg-transparent text-sm outline-none"
                              onKeyDown={(e) => handleTagKeyDown(e, value, onChange)}
                            />
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <PhotoLibrary 
          isOpen={isPhotoLibraryOpen}
          onClose={() => setIsPhotoLibraryOpen(false)}
          onInsert={insertImageFromLibrary}
        />
      </div>
    </FeatureGate>
  );
};

export default BlogEditor;