import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSettings, FiArrowLeft, FiImage, FiX, FiCheck, FiGlobe, FiLock, FiAlertCircle, FiList, FiLink, FiRefreshCcw, FiRefreshCw } from 'react-icons/fi';
// import { useAuth } from '../contexts/AuthContext';
import { useBlog } from '../contexts/BlogContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useDebounce } from '../hooks/useDebounce';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import FeatureAccessModal from '../components/FeatureAccessModal';
import { FeatureId } from '../types/features';
import PhotoLibrary from '../components/PhotoLibrary';
import { CategoryService } from '../services/api/categoryService';
import { i18nErrorHandler } from '../utils/i18nErrorHandler';

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
  categoryId: number;
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
  const { showError, showSuccess } = useSnackbar();
  const { checkFeatureAccess } = useFeatureAccess();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPhotoLibraryOpen, setIsPhotoLibraryOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'forbidden'>('idle');
  const [postId, setPostId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [hasFeatureAccess, setHasFeatureAccess] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
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
      categoryId: 1, // Default to first category
      tags: [],
      featuredImage: null,
      isPublished: false
    }
  });

  const watchedValues = watch();
  const debouncedValues = useDebounce(watchedValues, 2000);

  // Check feature access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const access = await checkFeatureAccess(FeatureId.BLOG_PUBLISHING);
        setHasFeatureAccess(access.hasAccess);
      } catch (error) {
        console.error('Error checking feature access:', error);
        setHasFeatureAccess(false);
      }
    };
    checkAccess();
  }, [checkFeatureAccess]);

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
      // Calculate word count and reading time
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      const count = words.length;
      setWordCount(count);
      setReadingTime(Math.ceil(count / 200)); // 200 words per minute
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[50vh] outline-none',
        role: 'textbox',
        'aria-label': t('blog.contentPlaceholder', 'Tell your story...'),
        'aria-multiline': 'true',
        'aria-describedby': 'editor-help',
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
              categoryId: post.categoryId || 1,
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
          i18nErrorHandler.showErrorToUser(
            error,
            { component: 'BlogEditor', action: 'loadPost' },
            [],
            t.bind(t)
          );
        }
      };
      loadPost();
    }
  }, [location.search, getBlogPostById, reset, editor]);

  // Fetch categories
  useEffect(() => {
    const categoryService = new CategoryService(import.meta.env.VITE_API_BASE_URL || '');
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await categoryService.getCategories();
        // Convert Category[] to expected format
        const formattedCategories = fetchedCategories.map(cat => ({
          id: cat.id.toString(),
          name: cat.name
        }));
        setCategories(formattedCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        i18nErrorHandler.showErrorToUser(
          err,
          { component: 'BlogEditor', action: 'fetchCategories' },
          [
            {
              label: t('common.retry'),
              onClick: () => window.location.reload(),
              style: 'primary'
            }
          ],
          t.bind(t)
        );
        // Fallback
        setCategories([
          { id: '1', name: 'Travel' },
          { id: '2', name: 'Food' },
          { id: '3', name: 'Culture' },
          { id: '4', name: 'Adventure' },
        ]);
      }
    };

    fetchCategories();
  }, []);



  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          categoryId: debouncedValues.categoryId,
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
        i18nErrorHandler.showErrorToUser(
          error,
          { component: 'BlogEditor', action: 'autoSave' },
          [],
          t.bind(t)
        );
      }
    };

    autoSave();
  }, [debouncedValues, postId, isDirty, updateBlogPost]);

  // --- HANDLERS ---
  const onSubmit = async (data: BlogFormValues) => {
    if (!data.title.trim()) {
      showError(t('blog.titleRequired', 'Title is required'));
      return;
    }

    setSaveStatus('saving');
    try {
      const payload = {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        categoryId: data.categoryId,
        tags: data.tags,
        images: data.featuredImage ? [data.featuredImage] : [],
        isPublished: data.isPublished
      };

      if (postId) {
        await updateBlogPost(postId, payload);
        setSaveStatus('saved');
        showSuccess(t('blog.postUpdated', 'Post updated successfully!'));
      } else {
        const newId = await createBlogPost(payload);
        setPostId(newId);
        window.history.replaceState(null, '', `?edit=${newId}`);
        setSaveStatus('saved');
        showSuccess(t('blog.postCreated', 'Post created successfully!'));
      }
    } catch (error) {
      console.error('Save failed:', error);
      if (error instanceof SubscriptionRequiredError) {
        setSaveStatus('forbidden');
      } else {
        setSaveStatus('error');
      }
      i18nErrorHandler.showErrorToUser(
        error,
        { component: 'BlogEditor', action: 'onSubmit' },
        error instanceof SubscriptionRequiredError ? [
          {
            label: t('common.contactSupport'),
            onClick: () => navigate('/subscription'),
            style: 'default'
          }
        ] : [],
        t.bind(t)
      );
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
          i18nErrorHandler.showErrorToUser(
            error,
            { component: 'BlogEditor', action: 'handlePublishToggle' },
            [
              {
                label: t('common.contactSupport'),
                onClick: () => navigate('/subscription'),
                style: 'default'
              }
            ],
            t.bind(t)
          );
        } else {
          setSaveStatus('error');
          i18nErrorHandler.showErrorToUser(
            error,
            { component: 'BlogEditor', action: 'handlePublishToggle' },
            [],
            t.bind(t)
          );
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-teal-50 flex flex-col">
        {/* HEADER */}
        <header className="sticky top-0 z-30 glass-effect border-b border-teal-200/30 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {watch('title') || t('blog.untitled')}
              </span>
              <div className="flex items-center gap-2 text-xs">
                {saveStatus === 'saving' && <span className="text-teal-600 animate-pulse">{t('blog.saving')}...</span>}
                {saveStatus === 'saved' && <span className="text-green-600 flex items-center gap-1"><FiCheck /> {t('blog.saved')}</span>}
                {saveStatus === 'error' && <span className="text-red-600">{t('blog.errorSaving')}</span>}
                {saveStatus === 'forbidden' && (
                  <span className="text-orange-600 flex items-center gap-1 font-medium">
                    <FiAlertCircle /> {t('blog.upgradeRequired', 'Upgrade Required')}
                  </span>
                )}
                {saveStatus === 'idle' && <span className="text-gray-400">{isDirty ? t('blog.unsavedChanges') : t('blog.uptodate')}</span>}
                <span className="text-gray-500">
                  {wordCount} {t('blog.words', 'words')} • {readingTime} {t('blog.minRead', 'min read')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button
              onClick={() => {
                if (!hasFeatureAccess) {
                  setShowUpgradeModal(true);
                  return;
                }
                handlePublishToggle();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                watch('isPublished') 
                  ? 'bg-linear-to-r from-emerald-100 to-teal-100 text-emerald-700 hover:from-emerald-200 hover:to-teal-200 shadow-md' 
                  : 'bg-linear-to-r from-slate-100 to-blue-100 text-slate-600 hover:from-slate-200 hover:to-blue-200'
              }`}
            >
              {watch('isPublished') ? <FiGlobe /> : <FiLock />}
              {watch('isPublished') ? t('blog.published') : t('blog.draft')}
            </button>

            <button
              onClick={handleSubmit((data) => {
                if (!hasFeatureAccess) {
                  setShowUpgradeModal(true);
                  return;
                }
                onSubmit(data);
              })}
              className="bg-linear-to-r from-teal-500 to-cyan-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {saveStatus === 'saving' ? t('blog.saving') : t('blog.save')}
            </button>
            
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`p-2 rounded-full transition-all duration-200 ${isPreview ? 'bg-linear-to-r from-teal-100 to-cyan-100 text-teal-700 shadow-md' : 'text-slate-500 hover:bg-linear-to-r hover:from-slate-100 hover:to-blue-100'}`}
            >
              <FiGlobe className="w-6 h-6" />
            </button>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-full transition-all duration-200 ${isSidebarOpen ? 'bg-linear-to-r from-teal-100 to-cyan-100 text-teal-700 shadow-md' : 'text-slate-500 hover:bg-linear-to-r hover:from-slate-100 hover:to-blue-100'}`}
            >
              <FiSettings className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* EDITOR / PREVIEW */}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 flex relative">
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            {isPreview ? (
              <div className="prose prose-lg max-w-none">
                <h1 className="text-4xl md:text-5xl font-bold mb-8">
                  {watch('title') || t('blog.untitled')}
                </h1>

                {watch('featuredImage') && (
                  <div className="relative w-full h-64 md:h-96 mb-8 rounded-xl overflow-hidden">
                    <img
                      src={watch('featuredImage')!}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }} />
              </div>
            ) : (
              <>
                <input
                  {...register('title')}
                  placeholder={t('blog.titlePlaceholder', 'Article Title')}
                  className="w-full text-4xl md:text-5xl font-bold placeholder-gray-300 border-none outline-none focus:ring-0 bg-transparent mb-8"
                  autoFocus
                  aria-label={t('blog.titlePlaceholder', 'Article Title')}
                  role="textbox"
                  aria-multiline="false"
                />

                {watch('featuredImage') && (
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
                    className="bg-white/95 backdrop-blur-sm shadow-xl border border-teal-200/30 rounded-lg overflow-hidden flex flex-wrap divide-x divide-teal-200/30 max-w-sm"
                    role="toolbar"
                    aria-label={t('blog.formattingToolbar', 'Text formatting toolbar')}
                  >
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`p-3 md:p-2 hover:bg-linear-to-r hover:from-slate-100 hover:to-blue-100 transition-all duration-200 ${editor.isActive('bold') ? 'text-teal-600 bg-linear-to-r from-teal-50 to-cyan-50' : 'text-slate-600'}`}
                      aria-label={t('blog.toggleBold', 'Toggle bold')}
                      aria-pressed={editor.isActive('bold')}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`p-3 md:p-2 hover:bg-linear-to-r hover:from-slate-100 hover:to-blue-100 transition-all duration-200 ${editor.isActive('italic') ? 'text-teal-600 bg-linear-to-r from-teal-50 to-cyan-50' : 'text-slate-600'}`}
                      aria-label={t('blog.toggleItalic', 'Toggle italic')}
                      aria-pressed={editor.isActive('italic')}
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={`p-3 md:p-2 hover:bg-linear-to-r hover:from-slate-100 hover:to-blue-100 transition-all duration-200 ${editor.isActive('heading', { level: 1 }) ? 'text-teal-600 bg-linear-to-r from-teal-50 to-cyan-50' : 'text-slate-600'}`}
                      aria-label={t('blog.toggleHeading1', 'Toggle heading level 1')}
                      aria-pressed={editor.isActive('heading', { level: 1 })}
                    >
                      H1
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`p-3 md:p-2 hover:bg-linear-to-r hover:from-slate-100 hover:to-blue-100 transition-all duration-200 ${editor.isActive('heading', { level: 2 }) ? 'text-teal-600 bg-linear-to-r from-teal-50 to-cyan-50' : 'text-slate-600'}`}
                      aria-label={t('blog.toggleHeading2', 'Toggle heading level 2')}
                      aria-pressed={editor.isActive('heading', { level: 2 })}
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`p-3 md:p-2 hover:bg-linear-to-r hover:from-slate-100 hover:to-blue-100 transition-all duration-200 ${editor.isActive('heading', { level: 3 }) ? 'text-teal-600 bg-linear-to-r from-teal-50 to-cyan-50' : 'text-slate-600'}`}
                      aria-label={t('blog.toggleHeading3', 'Toggle heading level 3')}
                      aria-pressed={editor.isActive('heading', { level: 3 })}
                    >
                      H3
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={`p-3 md:p-2 hover:bg-linear-to-r hover:from-slate-100 hover:to-blue-100 transition-all duration-200 ${editor.isActive('bulletList') ? 'text-teal-600 bg-linear-to-r from-teal-50 to-cyan-50' : 'text-slate-600'}`}
                      aria-label={t('blog.toggleBulletList', 'Toggle bullet list')}
                      aria-pressed={editor.isActive('bulletList')}
                    >
                      <FiList />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={`p-3 md:p-2 hover:bg-linear-to-r hover:from-slate-100 hover:to-blue-100 transition-all duration-200 ${editor.isActive('orderedList') ? 'text-teal-600 bg-linear-to-r from-teal-50 to-cyan-50' : 'text-slate-600'}`}
                      aria-label={t('blog.toggleOrderedList', 'Toggle ordered list')}
                      aria-pressed={editor.isActive('orderedList')}
                    >
                      1.
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = window.prompt('Enter URL:');
                        if (url) {
                          editor.chain().focus().setLink({ href: url }).run();
                        }
                      }}
                      className={`p-3 md:p-2 hover:bg-linear-to-r hover:from-slate-100 hover:to-blue-100 transition-all duration-200 ${editor.isActive('link') ? 'text-teal-600 bg-linear-to-r from-teal-50 to-cyan-50' : 'text-slate-600'}`}
                      aria-label={t('blog.insertLink', 'Insert link')}
                      aria-pressed={editor.isActive('link')}
                    >
                      <FiLink />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSidebarOpen(false);
                        setIsPhotoLibraryOpen(true);
                      }}
                      className="p-3 md:p-2 hover:bg-gray-50 text-gray-600"
                      aria-label={t('blog.insertImage', 'Insert image')}
                    >
                      <FiImage />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().undo().run()}
                      disabled={!editor.can().undo()}
                      className="p-3 md:p-2 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={t('blog.undo', 'Undo')}
                    >
                      <FiRefreshCcw />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().redo().run()}
                      disabled={!editor.can().redo()}
                      className="p-3 md:p-2 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={t('blog.redo', 'Redo')}
                    >
                      <FiRefreshCw />
                    </button>
                  </BubbleMenu>
                )}

                <EditorContent editor={editor} />
              </>
            )}
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
                initial={isMobile ? { y: '100%' } : { x: '100%' }}
                animate={{ x: 0, y: 0 }}
                exit={isMobile ? { y: '100%' } : { x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed bg-white/95 backdrop-blur-lg shadow-2xl z-50 overflow-y-auto border-t border-teal-200/30 ${
                  isMobile
                    ? 'bottom-0 left-0 right-0 h-3/4'
                    : 'right-0 top-0 bottom-0 w-96 border-l border-teal-200/30'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-lg font-semibold">{t('blog.postSettings')}</h2>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-linear-to-r hover:from-slate-100 hover:to-blue-100 rounded-full transition-all duration-200">
                      <FiX className="text-slate-600" />
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
                        {...register('categoryId')}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={parseInt(category.id)}>
                            {category.name}
                          </option>
                        ))}
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('blog.seoPreview', 'SEO Preview')}</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="text-teal-600 text-lg font-medium hover:underline cursor-pointer">
                          {watch('title') || t('blog.untitled')}
                        </div>
                        <div className="text-green-600 text-sm">
                          {window.location.origin}/blog/{postId || 'new'}
                        </div>
                        <div className="text-gray-600 text-sm mt-1">
                          {watch('excerpt') || t('blog.excerptHint')}
                        </div>
                      </div>
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

        {/* Upgrade Modal Overlay */}
        <FeatureAccessModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureId={FeatureId.BLOG_PUBLISHING}
          featureName={t('blog.publishing', 'Blog Publishing')}
        />
      </div>
    );
};

export default BlogEditor;