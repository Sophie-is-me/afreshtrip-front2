import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSettings, FiArrowLeft, FiImage, FiX, FiCheck, FiGlobe, FiLock, FiAlertCircle } from 'react-icons/fi';
// import { useAuth } from '../contexts/AuthContext';
import { useBlog } from '../contexts/BlogContext';
import { useDebounce } from '../hooks/useDebounce';
import FeatureGate from '../components/FeatureGate';
import { FeatureId } from '../types/features';
import PhotoLibrary from '../components/PhotoLibrary';

// --- TIPTAP V3 IMPORTS ---
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { SubscriptionRequiredError } from '../services/api';

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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'forbidden'>('idle');
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
        if (error instanceof SubscriptionRequiredError) {
          setSaveStatus('forbidden');
        } else {
          setSaveStatus('error');
        }
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
      if (error instanceof SubscriptionRequiredError) {
        setSaveStatus('forbidden');
        alert(t('blog.upgradeRequired', 'Subscription required to save changes.'));
      } else {
        setSaveStatus('error');
      }
    }
  };

  const handlePublishToggle = async () => {
    const newValue = !getValues('isPublished');
    
    // Optimistic UI update
    setValue('isPublished', newValue, { shouldDirty: true });
    
    if(postId) {
      try {
        setSaveStatus('saving');
        await updateBlogPost(postId, { isPublished: newValue });
        setSaveStatus('saved');
      } catch (error) {
        console.error('Publish toggle failed:', error);
        // Revert on failure
        setValue('isPublished', !newValue);
        
        if (error instanceof SubscriptionRequiredError) {
          setSaveStatus('forbidden');
          alert(t('blog.upgradeRequired', 'Subscription required to publish.'));
        } else {
          setSaveStatus('error');
        }
      }
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
    <FeatureGate
      feature={FeatureId.BLOG_PUBLISHING}
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <svg className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Blog Publishing</h2>
            <p className="text-gray-600 mb-4">Create and publish amazing blog posts about your travel experiences.</p>
            <p className="text-sm text-gray-500">This feature requires a subscription. Upgrade your account to start blogging!</p>
            <a
              href="/subscription"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Upgrade to Blog
            </a>
          </div>
        </div>
      }
    >
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
                {saveStatus === 'forbidden' && (
                  <span className="text-orange-600 flex items-center gap-1 font-medium">
                    <FiAlertCircle /> {t('blog.upgradeRequired', 'Upgrade Required')}
                  </span>
                )}
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