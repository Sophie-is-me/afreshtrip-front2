// BlogContext.tsx - Updated to use Firebase API
// Replace your existing BlogContext with this file

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as blogApi from '../services/blogApi';
import type { BlogPost, Comment, CreateBlogPostInput } from '../types/blog';

interface BlogContextType {
  // State
  blogPosts: BlogPost[];
  loading: boolean;
  error: string | null;
  
  // Read operations
  getAllBlogPosts: () => BlogPost[];
  getBlogPostById: (id: string) => Promise<BlogPost | null>;
  getPostById: (id: string) => BlogPost | undefined;
  getBlogDetails: (id: string) => Promise<{ post: BlogPost; comments: Comment[] }>;
  getBlogPostsPaginated: (page: number, size: number) => Promise<{
    posts: BlogPost[];
    total: number;
    hasMore: boolean;
  }>;
  getBlogPostsByCategory: (categorySlug: string) => Promise<BlogPost[]>; // ✅ NEW
  getUserBlogs: (page: number, size: number) => Promise<{
    posts: BlogPost[];
    total: number;
    hasMore: boolean;
  }>;
  getRelatedPosts: (currentId: string, category: string, limit?: number) => BlogPost[];
  
  // Write operations
  createBlogPost: (post: CreateBlogPostInput) => Promise<string>;
  updateBlogPost: (id: string, updates: Partial<CreateBlogPostInput>) => Promise<void>;
  deleteBlogPost: (id: string) => Promise<void>;
  addNewPost: (post: BlogPost) => void;
  
  // Statistics
  updatePostStatistics: (id: string, stats: { 
    views?: number; 
    likes?: number; 
    isLiked?: boolean; 
    isSaved?: boolean;
  }) => void;
  toggleLike: (postId: string) => Promise<boolean>; // ✅ NEW
  
  // Media
  uploadImage: (file: File) => Promise<string>;
  getUserMediaLibrary: (page?: number, size?: number) => Promise<{
    images: string[];
    total: number;
    hasMore: boolean;
  }>;
  
  // Comments (mock for now)
  toggleCommentLike: (commentId: string) => Promise<boolean>;
  addComment: (blogId: string, content: string, replyToId?: string) => Promise<Comment>;
  
  // Refresh
  refreshBlogPosts: () => Promise<void>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh all blog posts
  const refreshBlogPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Refreshing blog posts from Firebase...');
      
      const posts = await blogApi.getAllBlogPosts();
      setBlogPosts(posts);
      
      console.log('✅ Loaded', posts.length, 'posts from Firebase');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load posts';
      setError(errorMessage);
      console.error('❌ Error loading posts:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load posts on mount
  useEffect(() => {
    refreshBlogPosts();
  }, [refreshBlogPosts]);

  // Get all blog posts from state
  const getAllBlogPosts = useCallback(() => {
    return blogPosts;
  }, [blogPosts]);

  // Get blog post by ID from state
  const getPostById = useCallback((id: string) => {
    return blogPosts.find(p => p.id === id);
  }, [blogPosts]);

  // Get blog post by ID from Firebase
  const getBlogPostById = useCallback(async (id: string): Promise<BlogPost | null> => {
    try {
      console.log('📖 Fetching post:', id);
      const post = await blogApi.getBlogPostById(id);
      return post;
    } catch (err) {
      console.error('❌ Error fetching post:', err);
      return null;
    }
  }, []);

  // Get blog details with comments
  const getBlogDetails = useCallback(async (id: string): Promise<{ post: BlogPost; comments: Comment[] }> => {
    try {
      console.log('📖 Fetching blog details:', id);
      
      const post = await blogApi.getBlogPostById(id);
      
      if (!post) {
        throw new Error('Post not found');
      }

      // Mock comments for now (replace with real API later)
      const comments: Comment[] = [];
      
      console.log('✅ Fetched blog details');
      return { post, comments };
    } catch (err) {
      console.error('❌ Error fetching blog details:', err);
      throw err;
    }
  }, []);

  // Get paginated blog posts
  const getBlogPostsPaginated = useCallback(async (page: number, size: number) => {
    try {
      console.log('📊 Fetching paginated posts:', { page, size });
      
      // Get all posts first
      const allPosts = await blogApi.getAllBlogPosts();
      
      // Calculate pagination
      const startIndex = (page - 1) * size;
      const endIndex = startIndex + size;
      const paginatedPosts = allPosts.slice(startIndex, endIndex);
      
      console.log('✅ Fetched', paginatedPosts.length, 'posts (page', page, 'of', Math.ceil(allPosts.length / size), ')');
      
      return {
        posts: paginatedPosts,
        total: allPosts.length,
        hasMore: endIndex < allPosts.length
      };
    } catch (err) {
      console.error('❌ Error fetching paginated posts:', err);
      return {
        posts: [],
        total: 0,
        hasMore: false
      };
    }
  }, []);

  // ✅ NEW: Get blog posts by category
  const getBlogPostsByCategory = useCallback(async (categorySlug: string): Promise<BlogPost[]> => {
    try {
      console.log('📂 Fetching posts by category:', categorySlug);
      const posts = await blogApi.getBlogPostsByCategory(categorySlug);
      console.log('✅ Found', posts.length, 'posts in category');
      return posts;
    } catch (err) {
      console.error('❌ Error fetching posts by category:', err);
      return [];
    }
  }, []);

  // Get user's own blogs
  const getUserBlogs = useCallback(async (page: number, size: number) => {
    try {
      if (!user) {
        console.log('⚠️ No user logged in');
        return {
          posts: [],
          total: 0,
          hasMore: false
        };
      }

      console.log('📊 Fetching user blogs for:', user.uid);
      
      const userPosts = await blogApi.getUserBlogPosts();
      
      // Calculate pagination
      const startIndex = (page - 1) * size;
      const endIndex = startIndex + size;
      const paginatedPosts = userPosts.slice(startIndex, endIndex);
      
      console.log('✅ Fetched', paginatedPosts.length, 'user posts');
      
      return {
        posts: paginatedPosts,
        total: userPosts.length,
        hasMore: endIndex < userPosts.length
      };
    } catch (err) {
      console.error('❌ Error fetching user posts:', err);
      return {
        posts: [],
        total: 0,
        hasMore: false
      };
    }
  }, [user]);

  // Get related posts
  const getRelatedPosts = useCallback((currentId: string, category: string, limit: number = 3) => {
    return blogPosts
      .filter(p => p.id !== currentId && p.category === category && p.isPublished)
      .slice(0, limit);
  }, [blogPosts]);

  // Create blog post
  const createBlogPost = useCallback(async (data: CreateBlogPostInput): Promise<string> => {
    if (!user) {
      throw new Error('❌ User must be logged in to create posts');
    }

    try {
      setLoading(true);
      console.log('✨ Creating blog post...');
      console.log('👤 User:', user.uid);
      console.log('📝 Title:', data.title);
      console.log('🖼️ Images:', data.images?.length || 0);
      
      const postId = await blogApi.createBlogPost(data);
      
      console.log('✅ Post created! ID:', postId);

      // Refresh to show new post
      await refreshBlogPosts();
      
      return postId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
      console.error('❌ Error creating post:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, refreshBlogPosts]);

  // Update blog post
  const updateBlogPost = useCallback(async (id: string, updates: Partial<CreateBlogPostInput>) => {
    // Optimistic update
    setBlogPosts(prev =>
      prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
    );

    try {
      console.log('📝 Updating post:', id);
      await blogApi.updateBlogPost(id, updates);
      console.log('✅ Post updated!');
      
      // Refresh to get updated data
      await refreshBlogPosts();
    } catch (err) {
      console.error('❌ Failed to update post:', err);
      await refreshBlogPosts(); // Revert on error
      throw err;
    }
  }, [refreshBlogPosts]);

  // Delete blog post
  const deleteBlogPost = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Deleting post:', id);
      await blogApi.deleteBlogPost(id);
      console.log('✅ Post deleted!');
      
      // Remove from state
      setBlogPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('❌ Failed to delete post:', err);
      throw err;
    }
  }, []);

  // Add new post (optimistic update)
  const addNewPost = useCallback((post: BlogPost) => {
    setBlogPosts(prev => [post, ...prev]);
  }, []);

  // Upload image
  const uploadImage = useCallback(async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('❌ User must be logged in to upload images');
    }

    try {
      console.log('📤 Uploading image...');
      console.log('👤 User:', user.uid);
      console.log('📁 File:', file.name, '|', file.size, 'bytes');
      
      const url = await blogApi.uploadBlogMedia(file);
      
      console.log('✅ Image uploaded!');
      return url;
    } catch (err: any) {
      console.error('❌ Upload failed:', err);
      
      // Better error messages
      if (err.code === 'storage/unauthorized') {
        throw new Error('Permission denied. Make sure you are logged in and Storage rules are updated.');
      }
      
      throw err;
    }
  }, [user]);

  // Get user's media library (mock for now)
  const getUserMediaLibrary = useCallback(async (page: number = 1, size: number = 20) => {
    try {
      if (!user) {
        return { images: [], total: 0, hasMore: false };
      }

      console.log('📸 Fetching media library...');
      
      // Mock implementation (replace with real API later)
      const mockImages: string[] = [];
      
      return {
        images: mockImages,
        total: mockImages.length,
        hasMore: false
      };
    } catch (err) {
      console.error('❌ Failed to load media:', err);
      return { images: [], total: 0, hasMore: false };
    }
  }, [user]);

  // Update post statistics
  const updatePostStatistics = useCallback((id: string, stats: {
    views?: number;
    likes?: number;
    isLiked?: boolean;
    isSaved?: boolean;
  }) => {
    setBlogPosts(prev => prev.map(p => p.id === id ? { ...p, ...stats } : p));
  }, []);

  // ✅ NEW: Toggle like on a post
  const toggleLike = useCallback(async (postId: string): Promise<boolean> => {
    if (!user) {
      throw new Error('User must be logged in to like posts');
    }

    try {
      console.log('❤️ Toggling like for post:', postId);
      const isLiked = await blogApi.toggleLike(postId);
      
      // Update local state
      setBlogPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes: isLiked ? (p.likes || 0) + 1 : (p.likes || 0) - 1,
            isLiked: isLiked,
            likedBy: isLiked 
              ? [...(p.likedBy || []), user.uid]
              : (p.likedBy || []).filter((id: string) => id !== user.uid)
          };
        }
        return p;
      }));
      
      console.log(isLiked ? '✅ Liked!' : '✅ Unliked!');
      return isLiked;
    } catch (err) {
      console.error('❌ Error toggling like:', err);
      throw err;
    }
  }, [user]);

  // Toggle comment like (mock)
  const toggleCommentLike = useCallback(async (commentId: string): Promise<boolean> => {
    console.log('Mock: Toggle comment like', commentId);
    return true;
  }, []);

  // Add comment (mock)
  const addComment = useCallback(async (blogId: string, content: string, replyToId?: string): Promise<Comment> => {
    if (!user) {
      throw new Error('User must be logged in');
    }

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      author: {
        name: user.displayName || 'Anonymous',
        avatar: user.photoURL || ''
      },
      content,
      date: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      replies: []
    };

    return newComment;
  }, [user]);

  const value: BlogContextType = {
    blogPosts,
    loading,
    error,
    getAllBlogPosts,
    getBlogPostById,
    getPostById,
    getBlogDetails,
    getBlogPostsPaginated,
    getBlogPostsByCategory,
    getUserBlogs,
    getRelatedPosts,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    addNewPost,
    updatePostStatistics,
    toggleLike,
    uploadImage,
    getUserMediaLibrary,
    toggleCommentLike,
    addComment,
    refreshBlogPosts
  };

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
};

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};
