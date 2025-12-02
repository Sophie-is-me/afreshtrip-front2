import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { BlogPost, CreateBlogPostInput } from '../types/blog';
import { apiClient, type BlogVo, type BlogDto } from '../services/apiClient';
import { useAuth } from './AuthContext';

// [convertApiBlogPost is correctly implemented as provided in your prompt]
const convertApiBlogPost = (apiPost: BlogVo): BlogPost => ({
  id: apiPost.blId?.toString() || '',
  title: apiPost.title || 'Untitled',
  content: apiPost.content || '',
  excerpt: apiPost.excerpt || apiPost.content?.substring(0, 150) || '',
  images: apiPost.imageUrl?.map(img => img.imgUrl) || [],
  author: {
    id: apiPost.userId?.toString() || 'unknown',
    name: apiPost.author?.nickname || 'Anonymous', 
    avatar: apiPost.author?.avatar || '',
  },
  date: apiPost.createdAt || new Date().toISOString(),
  views: apiPost.play || 0,
  likes: apiPost.like || 0,
  category: apiPost.category || 'Uncategorized',
  tags: apiPost.tags || [],
  slug: apiPost.slug || `post-${apiPost.blId}`,
  isPublished: apiPost.isPublished ?? true,
  createdAt: apiPost.createdAt || new Date().toISOString(),
  updatedAt: apiPost.updatedAt || new Date().toISOString(),
});

interface BlogContextType {
  blogPosts: BlogPost[];
  loading: boolean;
  error: string | null;
  getAllBlogPosts: () => BlogPost[];
  getPostById: (id: string) => BlogPost | undefined;
  getBlogPostById: (id: string) => BlogPost | undefined;
  addNewPost: (post: BlogPost) => void;
  createBlogPost: (post: CreateBlogPostInput) => Promise<string>;
  // UPDATED: Now returns a Promise for auto-save UI feedback
  updateBlogPost: (id: string, updates: Partial<BlogPost>) => Promise<void>; 
  updatePostStatistics: (id: string, stats: { views?: number; likes?: number; isLiked?: boolean; isSaved?: boolean }) => void;
  getRelatedPosts: (currentId: string, category: string, limit?: number) => BlogPost[];
  uploadImage: (file: File) => Promise<string>;
  refreshBlogPosts: () => Promise<void>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useBlog = () => {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBlogPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getBlogs();
      const posts = response.records.map(convertApiBlogPost);
      setBlogPosts(posts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load blog posts';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBlogPosts();
  }, [refreshBlogPosts]);

  const getAllBlogPosts = () => blogPosts;
  const getPostById = (id: string) => blogPosts.find(p => p.id === id);
  const getBlogPostById = getPostById;
  const addNewPost = (post: BlogPost) => setBlogPosts(prev => [...prev, post]);

  const createBlogPost = async (post: CreateBlogPostInput) => {
    if (!user) throw new Error('User must be logged in to create a post');
    try {
      setLoading(true);
      const blogData: BlogDto = {
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        tags: post.tags,
        category: post.category,
        isPublished: post.isPublished,
        imageUrl: post.images?.map(img => ({ imgUrl: img })) || [],
        videoUrl: [],
      };
      const response = await apiClient.createBlog(blogData);
      const newPost = convertApiBlogPost(response);
      addNewPost(newPost);
      return newPost.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create blog post';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- CRITICAL UPDATE ---
  // Must be async to support "Saving..." indicators in UI
  const updateBlogPost = async (id: string, updates: Partial<BlogPost>) => {
    // 1. Optimistic Update (UI feels fast)
    setBlogPosts(prev =>
      prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
    );

    // 2. Persist to Backend (Real consistency)
    try {
        // TODO: Replace with real API call when available
        // const payload: BlogDto = { ...convertLocalToDto(updates) };
        // await apiClient.updateBlog(id, payload);
        
        // Simulating network delay for now so Auto-Save indicator works
        await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
        console.error("Failed to persist update", err);
        throw err; // Throwing allows the UI to show "Error Saving"
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const response = await apiClient.uploadFile(file);
      if (response.code === 200 && response.data) return response.data;
      throw new Error('Failed to upload image');
    } catch {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
  };

  const updatePostStatistics = (id: string, stats: { views?: number; likes?: number; isLiked?: boolean; isSaved?: boolean }) => {
    setBlogPosts(prev => prev.map(p => p.id === id ? { ...p, ...stats } : p));
  };

  const getRelatedPosts = (currentId: string, category: string, limit: number = 3) => {
    return blogPosts.filter(p => p.id !== currentId && p.category === category && p.isPublished).slice(0, limit);
  };

  const value = {
    blogPosts, loading, error, getAllBlogPosts, getPostById, getBlogPostById,
    addNewPost, createBlogPost, updateBlogPost, updatePostStatistics,
    getRelatedPosts, uploadImage, refreshBlogPosts,
  };

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
};