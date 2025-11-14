import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useBlog } from '../contexts/BlogContext';
import PhotoLibrary from '../components/PhotoLibrary';
import { useDebounce } from '../hooks/useDebounce';
import FeatureGate from '../components/FeatureGate';
import { FeatureId } from '../types/features';
import DOMPurify from 'dompurify';

interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featuredImage: string | null;
  isDraft: boolean;
  publishDate?: string;
}

const BlogEditor: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { createBlogPost, updateBlogPost, getBlogPostById, uploadImage } = useBlog();
  
  // Form state
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    featuredImage: null,
    isDraft: true
  });
  
  // UI state
  const [isPhotoLibraryOpen, setIsPhotoLibraryOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  
  // Editor refs
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const excerptRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-save functionality
  const debouncedFormData = useDebounce(formData, 2000);
  
  // Check if we're editing an existing post
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editId = searchParams.get('edit');
    
    if (editId) {
      setIsEditing(true);
      setPostId(editId);
      
      // Load the post data
      const loadPost = async () => {
        try {
          const post = await getBlogPostById(editId);
          if (post) {
            setFormData({
              title: post.title,
              excerpt: post.excerpt || '',
              content: post.content,
              category: post.category,
              tags: post.tags || [],
              featuredImage: post.images?.[0] || null,
              isDraft: !post.isPublished
            });
            
            // Set editor content
            if (editorRef.current) {
              editorRef.current.innerHTML = DOMPurify.sanitize(post.content);
            }
          }
        } catch (error) {
          console.error('Error loading post:', error);
          setPublishError(t('blog.errorLoadingPost'));
        }
      };
      
      loadPost();
    }
  }, [location.search, getBlogPostById, t]);
  
  // Auto-save functionality
  useEffect(() => {
    if (isEditing && postId) {
      const saveDraft = async () => {
        try {
          setSaveStatus('saving');
          const content = DOMPurify.sanitize(editorRef.current?.innerHTML || '');
          const blogPostData = {
            title: debouncedFormData.title,
            content,
            excerpt: debouncedFormData.excerpt,
            images: debouncedFormData.featuredImage ? [debouncedFormData.featuredImage] : [],
            author: {
              id: user?.uid || 'anonymous',
              name: user?.displayName || user?.email || 'Anonymous',
              avatar: user?.photoURL || 'https://picsum.photos/seed/default/100/100.jpg'
            },
            date: new Date().toISOString(),
            views: 0,
            likes: 0,
            category: debouncedFormData.category,
            tags: debouncedFormData.tags,
            slug: debouncedFormData.title.toLowerCase().replace(/ /g, '-'),
            isPublished: false
          };
          await updateBlogPost(postId, blogPostData);
          setSaveStatus('saved');
          setLastSaved(new Date());
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
          console.error('Error auto-saving:', error);
        }
      };

      saveDraft();
    }
  }, [debouncedFormData, isEditing, postId, updateBlogPost, user]);
  
  // Handle form field changes
  const handleInputChange = useCallback((field: keyof BlogFormData, value: BlogFormData[keyof BlogFormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsSaving(true);
        const imageUrl = await uploadImage(file);
        handleInputChange('featuredImage', imageUrl);
        setIsSaving(false);
      } catch (error) {
        console.error('Error uploading image:', error);
        setPublishError(t('blog.errorUploadingImage'));
        setIsSaving(false);
      }
    }
  };
  
  // Rich text editor commands
  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    
    // Update content in form data
    if (editorRef.current) {
      handleInputChange('content', DOMPurify.sanitize(editorRef.current.innerHTML));
    }
  }, [handleInputChange]);
  
  // Insert link
  const insertLink = useCallback(() => {
    const url = prompt(t('blog.enterUrl'));
    if (url) {
      executeCommand('createLink', url);
    }
  }, [executeCommand, t]);
  
  // Insert image
  const insertImage = useCallback((imageSrc: string) => {
    executeCommand('insertHTML', `<img src="${imageSrc}" alt="Blog image" class="max-w-full h-auto" />`);
    setIsPhotoLibraryOpen(false);
  }, [executeCommand]);
  
  // Handle tag input
  const handleTagInput = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = (e.target as HTMLInputElement).value.trim();
      if (value && !formData.tags.includes(value)) {
        handleInputChange('tags', [...formData.tags, value]);
        (e.target as HTMLInputElement).value = '';
      }
    }
  }, [formData.tags, handleInputChange]);
  
  // Remove tag
  const removeTag = useCallback((tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  }, [formData.tags, handleInputChange]);
  
  // Handle publish
  const handlePublish = async () => {
    // Validate form
    if (!formData.title.trim()) {
      setPublishError(t('blog.titleRequired'));
      titleRef.current?.focus();
      return;
    }
    
    if (!formData.content.trim()) {
      setPublishError(t('blog.contentRequired'));
      editorRef.current?.focus();
      return;
    }
    
    setIsPublishing(true);
    setPublishError(null);
    
    try {
      const content = DOMPurify.sanitize(editorRef.current?.innerHTML || '');
      const publishDate = new Date().toISOString();
      const blogPostData = {
        title: formData.title,
        content,
        excerpt: formData.excerpt,
        images: formData.featuredImage ? [formData.featuredImage] : [],
        author: {
          id: user?.uid || 'anonymous',
          name: user?.displayName || user?.email || 'Anonymous',
          avatar: user?.photoURL || 'https://picsum.photos/seed/default/100/100.jpg'
        },
        date: publishDate,
        views: 0,
        likes: 0,
        category: formData.category,
        tags: formData.tags,
        slug: formData.title.toLowerCase().replace(/ /g, '-'),
        isPublished: true
      };

      let id;
      if (isEditing && postId) {
        await updateBlogPost(postId, blogPostData);
        id = postId;
      } else {
        id = await createBlogPost(blogPostData);
      }

      navigate('/blog/publish-success', { state: { id } });
    } catch (error) {
      console.error('Error publishing post:', error);
      setPublishError(t('blog.errorPublishing'));
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Handle save draft
  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      setPublishError(t('blog.titleRequired'));
      titleRef.current?.focus();
      return;
    }
    
    setIsSaving(true);
    setPublishError(null);
    
    try {
      const content = DOMPurify.sanitize(editorRef.current?.innerHTML || '');
      const blogPostData = {
        title: formData.title,
        content,
        excerpt: formData.excerpt,
        images: formData.featuredImage ? [formData.featuredImage] : [],
        author: {
          id: user?.uid || 'anonymous',
          name: user?.displayName || user?.email || 'Anonymous',
          avatar: user?.photoURL || 'https://picsum.photos/seed/default/100/100.jpg'
        },
        date: new Date().toISOString(),
        views: 0,
        likes: 0,
        category: formData.category,
        tags: formData.tags,
        slug: formData.title.toLowerCase().replace(/ /g, '-'),
        isPublished: false
      };

      if (isEditing && postId) {
        await updateBlogPost(postId, blogPostData);
      } else {
        await createBlogPost(blogPostData);
      }

      setSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving draft:', error);
      setPublishError(t('blog.errorSaving'));
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle back
  const handleBack = () => {
    navigate(-1);
  };
  
  // Categories
  const categories = [
    'Travel',
    'Food',
    'Culture',
    'Adventure',
    'Nature',
    'City Guide',
    'Tips & Tricks',
    'Photography'
  ];
  
  return (
    <FeatureGate feature={FeatureId.BLOG_PUBLISHING}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <button
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('blog.back')}
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? t('blog.editPost') : t('blog.createPost')}
            </h1>
          </div>
          
          {/* Auto-save indicator */}
          {isEditing && (
            <div className="flex items-center">
              {saveStatus === 'saving' && (
                <div className="flex items-center text-gray-500">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('blog.saving')}
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center text-green-600">
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t('blog.saved')}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Title Input */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {t('blog.title')} <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('blog.enterBlogTitle')}
            />
          </div>

          {/* Excerpt Input */}
          <div className="mb-6">
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
              {t('blog.excerpt')}
            </label>
            <textarea
              ref={excerptRef}
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('blog.enterExcerpt')}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('blog.excerptHint')}
            </p>
          </div>

          {/* Category and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                {t('blog.category')}
              </label>
              <select
                ref={categoryRef}
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('blog.selectCategory')}</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                {t('blog.tags')}
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 inline-flex text-blue-600 hover:text-blue-800"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <input
                ref={tagInputRef}
                type="text"
                id="tags"
                placeholder={t('blog.addTags')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={handleTagInput}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('blog.tagsHint')}
              </p>
            </div>
          </div>

          {/* Featured Image */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('blog.featuredImage')}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {formData.featuredImage ? (
                <div>
                  <img src={formData.featuredImage} alt="Preview" className="max-w-full h-48 object-cover mx-auto mb-4 rounded" />
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setIsPhotoLibraryOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {t('blog.changeImage')}
                    </button>
                    <button
                      onClick={() => handleInputChange('featuredImage', null)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      {t('blog.removeImage')}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="mt-4">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">{t('blog.uploadAnImage')}</span>
                      <input
                        id="image-upload"
                        name="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="sr-only"
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">{t('blog.imageHint')}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => setIsPhotoLibraryOpen(true)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      {t('blog.selectFromLibrary')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rich Text Editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('blog.content')} <span className="text-red-500">*</span>
            </label>

            {/* Toolbar */}
            <div className="border border-gray-300 rounded-t-md bg-gray-50 p-2 flex flex-wrap gap-2">
              <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
                <button
                  onClick={() => executeCommand('formatBlock', 'h1')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title={t('blog.h1')}
                >
                  H1
                </button>
                <button
                  onClick={() => executeCommand('formatBlock', 'h2')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title={t('blog.h2')}
                >
                  H2
                </button>
                <button
                  onClick={() => executeCommand('formatBlock', 'h3')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title={t('blog.h3')}
                >
                  H3
                </button>
              </div>
              
              <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
                <button
                  onClick={() => executeCommand('bold')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
                  title={t('blog.bold')}
                >
                  B
                </button>
                <button
                  onClick={() => executeCommand('italic')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 italic"
                  title={t('blog.italic')}
                >
                  I
                </button>
                <button
                  onClick={() => executeCommand('underline')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 underline"
                  title={t('blog.underline')}
                >
                  U
                </button>
              </div>
              
              <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
                <button
                  onClick={() => executeCommand('insertUnorderedList')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title={t('blog.bulletList')}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 5a2 2 0 100 4 2 2 0 000-4zM5 11a2 2 0 100 4 2 2 0 000-4zM5 17a2 2 0 100 4 2 2 0 000-4zM9 6a1 1 0 000 2h8a1 1 0 100-2H9zM9 12a1 1 0 100 2h8a1 1 0 100-2H9zM9 18a1 1 0 100 2h8a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => executeCommand('insertOrderedList')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title={t('blog.numberedList')}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 3a1 1 0 000 2h8a1 1 0 100-2H5zM5 9a1 1 0 000 2h8a1 1 0 100-2H5zM5 15a1 1 0 000 2h8a1 1 0 100-2H5zM2 5a1 1 0 011-1h.01a1 1 0 110 2H3a1 1 0 01-1-1zM2 11a1 1 0 011-1h.01a1 1 0 110 2H3a1 1 0 01-1-1zM2 17a1 1 0 011-1h.01a1 1 0 110 2H3a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={insertLink}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title={t('blog.link')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsPhotoLibraryOpen(true)}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title={t('blog.image')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => executeCommand('removeFormat')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                  title={t('blog.clearFormatting')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Editor */}
            <div
              ref={editorRef}
              contentEditable
              className="min-h-64 p-4 border border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ minHeight: '256px' }}
              onInput={() => handleInputChange('content', DOMPurify.sanitize(editorRef.current?.innerHTML || ''))}
            />
          </div>

          {/* Error Message */}
          {publishError && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{publishError}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              <p>{t('blog.lastSaved')}: {lastSaved ? lastSaved.toLocaleString() : t('blog.never')}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('blog.saving')}
                  </div>
                ) : (
                  t('blog.saveDraft')
                )}
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPublishing ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('blog.publishing')}
                  </div>
                ) : (
                  t('blog.publish')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <PhotoLibrary
        isOpen={isPhotoLibraryOpen}
        onClose={() => setIsPhotoLibraryOpen(false)}
        onInsert={insertImage}
      />
    </div>
    </FeatureGate>
  );
};

export default BlogEditor;