import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { BlogPost, CreateBlogPostInput, Comment } from '../types/blog';
import type { Comment as ApiComment } from '../types/api';
import {
  apiClient,
  type BlogVo,
  type BlogDto,
} from '../services/apiClient';
import { useAuth } from './AuthContext';
import { SubscriptionRequiredError } from '../services/api';

// Helper to convert Backend VO to Frontend Model
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

// Helper to convert API Comment to Frontend Comment
const convertApiComment = (apiComment: ApiComment): Comment => {
  try {
    // Comprehensive null checks
    const author = apiComment.author;
    const nickname = author?.nickname || 'Anonymous';
    const avatar = author?.avatar || '';

    return {
      id: apiComment.id?.toString() || '',
      author: {
        name: nickname,
        avatar: avatar,
      },
      content: apiComment.content || '',
      date: apiComment.createdAt || new Date().toISOString(),
      likes: apiComment.likes || 0,
      isLiked: apiComment.isLiked || false,
      replies: [], // Note: Handle nested replies if backend supports
    };
  } catch (error) {
    console.error('Error converting API comment:', error, apiComment);
    // Return a safe fallback comment
    return {
      id: 'error-comment',
      author: {
        name: 'Anonymous',
        avatar: '',
      },
      content: 'Error loading comment',
      date: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      replies: [],
    };
  }
};

interface BlogContextType {
  blogPosts: BlogPost[];
  loading: boolean;
  error: string | null;
  getAllBlogPosts: () => BlogPost[];
  getBlogPostsPaginated: (page: number, size: number) => Promise<{
    posts: BlogPost[];
    total: number;
    hasMore: boolean;
  }>;
  getPostById: (id: string) => BlogPost | undefined;
  getBlogPostById: (id: string) => BlogPost | undefined;
  getBlogDetails: (id: string) => Promise<{ post: BlogPost; comments: Comment[] }>;
  toggleCommentLike: (commentId: string) => Promise<boolean>;
  addComment: (blogId: string, content: string, replyToId?: string) => Promise<Comment>;
  addNewPost: (post: BlogPost) => void;
  createBlogPost: (post: CreateBlogPostInput) => Promise<string>;
  updateBlogPost: (id: string, updates: Partial<BlogPost>) => Promise<void>;
  updatePostStatistics: (id: string, stats: { views?: number; likes?: number; isLiked?: boolean; isSaved?: boolean }) => void;
  getRelatedPosts: (currentId: string, category: string, limit?: number) => BlogPost[];
  uploadImage: (file: File) => Promise<string>;
  refreshBlogPosts: () => Promise<void>;

  // Updated signature for pagination
  getUserMediaLibrary: (page?: number, size?: number) => Promise<{
    images: string[];
    total: number;
    hasMore: boolean;
  }>;
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

  const getBlogPostsPaginated = async (page: number, size: number) => {
    try {
      const response = await apiClient.getBlogs(page, size);
      const posts = response.records.map(convertApiBlogPost);
      return {
        posts,
        total: response.total,
        hasMore: response.current * response.size < response.total
      };
    } catch (err) {
      console.error('Error fetching paginated blog posts:', err);
      // Return empty result for network errors or API issues
      return {
        posts: [],
        total: 0,
        hasMore: false
      };
    }
  };

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
        categoryId: post.categoryId || 1, // Default to first category if not specified
        isPublished: post.isPublished,
        imageUrl: post.images?.map(img => ({ imgUrl: img })) || [],
        videoUrl: [],
      };
      const response = await apiClient.createBlog(blogData);
      const newPost = convertApiBlogPost(response);
      addNewPost(newPost);
      return newPost.id;
    } catch (err) {
      if (err instanceof SubscriptionRequiredError) {
        throw err;
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to create blog post';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates a blog post using PATCH (Partial Update)
   * This is safer than PUT as it doesn't overwrite fields not present in the update
   */
  const updateBlogPost = async (id: string, updates: Partial<BlogPost>) => {
    // 1. Optimistic Update (UI feels fast)
    setBlogPosts(prev =>
      prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
    );

    // 2. Persist to Backend via PATCH
    try {
      const blogId = parseInt(id, 10);
      
      // Construct Partial DTO
      // We only include fields that are actually in the 'updates' object
      const payload: Partial<BlogDto> = {};

      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.content !== undefined) payload.content = updates.content;
      if (updates.excerpt !== undefined) payload.excerpt = updates.excerpt;
      if (updates.category !== undefined) payload.categoryId = updates.categoryId || 1; // Map category to categoryId
      if (updates.tags !== undefined) payload.tags = updates.tags;
      if (updates.isPublished !== undefined) payload.isPublished = updates.isPublished;
      
      // Special handling for images array
      if (updates.images !== undefined) {
        payload.imageUrl = updates.images.map(url => ({ imgUrl: url }));
      }
      
      // Note: We do NOT explicitly set videoUrl to [] here. 
      // The backend PATCH endpoint will ignore fields not present in the payload,
      // preserving any existing videos on this post.

      await apiClient.patchBlog(blogId, payload);

    } catch (err) {
      console.error("Failed to persist update", err);
      
      // Critical: Re-throw Subscription errors so the UI can show the paywall
      if (err instanceof SubscriptionRequiredError) {
        throw err;
      }
      // For other errors, the optimistic update might be out of sync, 
      // but we allow the UI 'error' state to handle it.
      throw err;
    }
  };

  /**
   * Uploads an image to the backend storage
   */
  const uploadImage = async (file: File): Promise<string> => {
    try {
      return await apiClient.uploadFile(file);
    } catch (err) {
      console.error('Upload failed:', err);
      throw err;
    }
  };

  /**
   * Retrieves user's historical media with pagination
   */
  const getUserMediaLibrary = async (page: number = 1, size: number = 20): Promise<{
    images: string[];
    total: number;
    hasMore: boolean;
  }> => {
    try {
      return await apiClient.getUserMedia(page, size);
    } catch (err) {
      console.error('Failed to load media library:', err);
      return { images: [], total: 0, hasMore: false };
    }
  };

  const updatePostStatistics = (id: string, stats: { views?: number; likes?: number; isLiked?: boolean; isSaved?: boolean }) => {
    setBlogPosts(prev => prev.map(p => p.id === id ? { ...p, ...stats } : p));
  };

  const getBlogDetails = async (id: string): Promise<{ post: BlogPost; comments: Comment[] }> => {
    try {
      const blogCommentVo = await apiClient.getBlogById(parseInt(id, 10));
      const post = convertApiBlogPost(blogCommentVo);
      const comments = (blogCommentVo.comment || []).map(convertApiComment);
      return { post, comments };
    } catch (err) {
      console.error('Error fetching blog details:', err);
      // Return empty result instead of throwing
      return {
        post: {} as BlogPost,
        comments: []
      };
    }
  };

  const toggleCommentLike = async (commentId: string): Promise<boolean> => {
    try {
      return await apiClient.toggleCommentLike(parseInt(commentId, 10));
    } catch (err) {
      console.error('Error toggling comment like:', err);
      throw err;
    }
  };

  const addComment = async (blogId: string, content: string, replyToId?: string): Promise<Comment> => {
    try {
      const apiComment = await apiClient.addComment(parseInt(blogId, 10), content, replyToId ? parseInt(replyToId, 10) : undefined);
      return convertApiComment(apiComment);
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  };

  const getRelatedPosts = (currentId: string, category: string, limit: number = 3) => {
    return blogPosts.filter(p => p.id !== currentId && p.category === category && p.isPublished).slice(0, limit);
  };

  const value = {
    blogPosts, loading, error, getAllBlogPosts, getBlogPostsPaginated, getPostById, getBlogPostById, getBlogDetails, toggleCommentLike, addComment,
    addNewPost, createBlogPost, updateBlogPost, updatePostStatistics,
    getRelatedPosts, uploadImage, refreshBlogPosts, getUserMediaLibrary,
  };

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
};