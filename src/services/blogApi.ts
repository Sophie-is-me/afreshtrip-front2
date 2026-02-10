// src/services/blogApi.ts
// 🔥 COMPLETE FIX: String replacement BEFORE JSON.parse + Allow unauthenticated blog viewing

import axios, { type AxiosInstance } from 'axios';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  increment,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../lib/firebase/client';
import type { BlogPost, CreateBlogPostInput, Comment } from '../types/blog';

// ============================================================================
// CONFIGURATION
// ============================================================================

const IS_CHINESE_VERSION = import.meta.env.VITE_IS_CHINESE_VERSION === 'true';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.10.243:9000/web';
const DEFAULT_AVATAR = '/assets/default-avatar.png';

console.log('🌍 Blog API Mode:', IS_CHINESE_VERSION ? 'Chinese Backend' : 'Firebase');
if (IS_CHINESE_VERSION) {
  console.log('🔗 API Base URL:', API_BASE_URL);
}

// ============================================================================
// HTTP CLIENT
// ============================================================================

class HttpClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
      
      // ✅ CRITICAL FIX: Replace large numbers with quoted strings BEFORE JSON parsing!
      transformResponse: [(data) => {
        if (typeof data === 'string') {
          try {
            // 🔥 STEP 1: Replace large number IDs with quoted strings in the RAW JSON
            // This regex finds: "blId": 123456789 and replaces with: "blId": "123456789"
            const fixedData = data.replace(
              /"(blId|userId|categoryId|commentId|replyToCommentId)":\s*(\d{10,})/g,
              '"$1":"$2"'
            );
            
            // 🔥 STEP 2: NOW parse the JSON (numbers are already strings!)
            const parsed = JSON.parse(fixedData);
            
            console.log('✅ JSON parsed with ID preservation');
            return parsed;
          } catch (e) {
            console.error('❌ JSON parse error:', e);
            return data;
          }
        }
        return data;
      }],
    });

    // ✅ Make Authorization optional - allow unauthenticated requests
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('custom_auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.log('ℹ️ No auth token - proceeding with unauthenticated request');
        }
        console.log('📤', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log('📥 Response:', response.data);
        return response.data;
      },
      (error) => {
        console.error('❌ HTTP Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string): Promise<T> {
    return this.client.get(url);
  }

  async post<T>(url: string, data?: any): Promise<T> {
    return this.client.post(url, data);
  }

  async put<T>(url: string, data?: any): Promise<T> {
    return this.client.put(url, data);
  }

  async delete<T>(url: string): Promise<T> {
    return this.client.delete(url);
  }

  async postFormData<T>(url: string, formData: FormData): Promise<T> {
    return this.client.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
}

const httpClient = new HttpClient(API_BASE_URL);

// ============================================================================
// CONSTANTS
// ============================================================================

const BLOG_COLLECTION = 'blogs';

// Category mapping
const getCategoryName = (categoryId: number | string): string => {
  const id = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
  
  const categories: Record<number, string> = {
    1: 'Adventure',
    2: 'Culture',
    3: 'Food',
    4: 'Travel',
    5: 'Technology',
    6: 'Lifestyle'
  };
  
  return categories[id] || 'General';
};

// Slug generation
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

// Timestamp conversion
const timestampToString = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  if (typeof timestamp === 'string') return timestamp;
  if (timestamp.toDate) return timestamp.toDate().toISOString();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toISOString();
  return new Date().toISOString();
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// ✅ Check if user can edit post
export const canEditPost = (post: BlogPost, currentUserId?: string): boolean => {
  if (!currentUserId) return false;
  
  // Convert both to strings for comparison
  const postUserId = String(post.userId);
  const currentUserIdStr = String(currentUserId);
  
  console.log('🔐 Checking edit permission:');
  console.log('   Post userId:', postUserId);
  console.log('   Current userId:', currentUserIdStr);
  console.log('   Can edit:', postUserId === currentUserIdStr);
  
  return postUserId === currentUserIdStr;
};

// ============================================================================
// MEDIA UPLOAD
// ============================================================================

export const uploadBlogMedia = async (file: File): Promise<string> => {
  console.log('📤 Uploading media:', file.name);

  if (IS_CHINESE_VERSION) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      interface UploadResponse {
        code: number;
        msg: string;
        data: {
          id: number;
          name: string;
          path: string;
        } | string; // Can be object or string
      }

      const response = await httpClient.postFormData<UploadResponse>('/file/upload', formData);

      if (response.code !== 200) {
        throw new Error(response.msg || 'Upload failed');
      }

      console.log('✅ Media uploaded:', response.data);
      
      // ✅ FIX: Construct full URL from response
      if (typeof response.data === 'object') {
        // Backend returns {id, name, path}, construct full URL
        const fullUrl = `${API_BASE_URL}/file/view/${response.data.id}`;
        console.log('🔗 Full image URL:', fullUrl);
        return fullUrl;
      } else {
        // Backend returns URL string directly
        return response.data;
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  } else {
    // Firebase upload
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to upload');

    const storageRef = ref(storage, `blogs/${user.uid}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    console.log('✅ Media uploaded to Firebase:', url);
    return url;
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Process image URLs before saving to backend
 * - Remove blob URLs (client-side only)
 * - Convert object responses to proper URLs
 * - Keep only valid server URLs
 */
const processImageUrls = (images: any[]): string[] => {
  if (!Array.isArray(images)) return [];
  
  const processed = images
    .map(img => {
      // Handle object response from upload
      if (typeof img === 'object' && img !== null) {
        if (img.id) {
          // Upload response object: {id, name, path}
          return `${API_BASE_URL}/file/view/${img.id}`;
        }
        if (img.imgUrl) {
          // Backend response object: {imgUrl: "..."}
          return img.imgUrl;
        }
        return null;
      }
      
      // Handle string URLs
      if (typeof img === 'string') {
        // Skip blob URLs (client-side temporary URLs)
        if (img.startsWith('blob:')) {
          console.warn('⚠️ Skipping blob URL:', img);
          return null;
        }
        // Keep server URLs
        return img;
      }
      
      return null;
    })
    .filter(Boolean) as string[];
  
  console.log('🔄 Processed images:', images.length, '→', processed.length);
  return processed;
};

// ============================================================================
// CREATE BLOG POST
// ============================================================================

export const createBlogPost = async (input: CreateBlogPostInput): Promise<string> => {
  console.log('✨ Creating blog post...');

  if (IS_CHINESE_VERSION) {
    try {
      interface SaveBlogResponse {
        code: number;
        msg: string;
        data?: { blId: string; [key: string]: any };  // ✅ String type
      }

      const imageUrl = (input.images || []).map(url => ({ imgUrl: url }));
      const videoUrl = (input.videos || []).map(url => ({ viUrl: url }));

      const requestBody = {
        title: input.title,
        content: input.content,
        excerpt: input.excerpt || '',
        categoryId: input.categoryId,
        imageUrl: imageUrl,
        videoUrl: videoUrl,
        coverUrl: input.images?.[0] || '',
      };

      console.log('📤 POST /blog/saveBlog:', requestBody);

      const response = await httpClient.post<SaveBlogResponse>('/blog/saveBlog', requestBody);

      if (response.code !== 200) {
        throw new Error(response.msg || 'Failed to create post');
      }

      if (response.data && response.data.blId) {
        const postId = String(response.data.blId);  // ✅ Already string from parser
        console.log('✅ Post created with ID:', postId);
        return postId;
      }

      throw new Error('No blog ID in response');
    } catch (error: any) {
      console.error('❌ Create post error:', error);
      throw error;
    }
  } else {
    // Firebase implementation
    const user = auth.currentUser;
    if (!user) throw new Error('User must be authenticated');

    const categoryName = getCategoryName(input.categoryId);
    const slug = generateSlug(input.title);

    const postData = {
      title: input.title,
      content: input.content,
      excerpt: input.excerpt || '',
      category: categoryName,
      categoryId: input.categoryId,
      tags: input.tags || [],
      images: input.images || [],
      videos: input.videos || [],
      slug: slug,
      isPublished: input.isPublished,
      views: 0,
      likes: 0,
      likedBy: [],
      author: {
        id: user.uid,
        name: user.displayName || 'Anonymous',
        avatar: user.photoURL || DEFAULT_AVATAR
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      date: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'blogs'), postData);
    console.log('✅ Post created with ID:', docRef.id);
    return docRef.id;
  }
};


// ============================================================================
// UPDATE BLOG POST
// ============================================================================

export const updateBlogPost = async (
  postId: string,
  updates: Partial<CreateBlogPostInput>
): Promise<void> => {
  console.log('📝 Updating post:', postId);

  if (IS_CHINESE_VERSION) {
    try {
      interface SaveBlogResponse {
        code: number;
        msg: string;
        data?: any;
      }

      const requestBody: any = {
        blId: postId,               // ✅ required for update
        title: updates.title,
        content: updates.content,
        excerpt: updates.excerpt,
        categoryId: updates.categoryId,
      };

      /**
       * ✅ IMPORTANT:
       * Must match CREATE behavior exactly
       * imageUrl = string[]
       */
      if (updates.images) {
        const validImages = updates.images.filter(
          url => url && !url.startsWith('blob:')
        );

        requestBody.imageUrl = validImages;      // ✅ STRING ARRAY
        requestBody.coverUrl = validImages[0] || '';
      }

      if (updates.videos) {
        requestBody.videoUrl = updates.videos;   // ✅ STRING ARRAY
      }

      console.log('📤 POST /blog/saveBlog (Update):', requestBody);

      const response = await httpClient.post<SaveBlogResponse>(
        '/blog/saveBlog',
        requestBody
      );

      if (response.code !== 200) {
        throw new Error(response.msg || 'Update failed');
      }

      console.log('✅ Post updated (images replaced)');
    } catch (error) {
      console.error('❌ Update post error:', error);
      throw error;
    }
  } 
  // 🌍 Firebase path unchanged
  else {
    const docRef = doc(db, 'blogs', postId);
    const updateData: any = { ...updates };

    if (updates.categoryId) {
      updateData.category = getCategoryName(updates.categoryId);
    }

    if (updates.title) {
      updateData.slug = generateSlug(updates.title);
    }

    updateData.updatedAt = serverTimestamp();
    await updateDoc(docRef, updateData);

    console.log('✅ Post updated');
  }
};


// ============================================================================
// DELETE BLOG POST
// ============================================================================

export const deleteBlogPost = async (postId: string): Promise<void> => {
  console.log('🗑️ Deleting post:', postId);

  if (IS_CHINESE_VERSION) {
    try {
      interface DeleteResponse {
        code: number;
        msg: string;
      }

      const response = await httpClient.delete<DeleteResponse>(`/blog/${postId}`);

      if (response.code !== 200) {
        throw new Error(response.msg || 'Delete failed');
      }

      console.log('✅ Post deleted');
    } catch (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }
  } else {
    const docRef = doc(db, BLOG_COLLECTION, postId);
    await deleteDoc(docRef);
    console.log('✅ Post deleted');
  }
};

// ============================================================================
// GET ALL BLOG POSTS (✅ WORKS WITHOUT AUTH!)
// ============================================================================

export const getAllBlogPosts = async (): Promise<BlogPost[]> => {
  console.log('📖 Fetching all published blog posts...');

  if (IS_CHINESE_VERSION) {
    try {
      interface BlogListResponse {
        code: number;
        msg: string;
        data: {
          records: any[];
          total: number;
        };
      }

      // ✅ Use /blog/my for authenticated, /blog/list for public
      const token = localStorage.getItem('custom_auth_token');
      const endpoint = token ? '/blog/my?current=1&size=100' : '/blog/list?current=1&size=100';
      
      console.log('📡 Fetching from:', endpoint, token ? '(authenticated)' : '(public)');

      const response = await httpClient.get<BlogListResponse>(endpoint);

      if (response.code !== 200) {
        console.error('❌ Failed to fetch blogs:', response.msg);
        return [];
      }

      if (response.data && response.data.records) {
        const posts: BlogPost[] = response.data.records.map((record: any) => {
          // ✅ Log to verify IDs are preserved
          console.log('🔍 Mapping post - blId:', record.blId, 'Type:', typeof record.blId);
          
          return {
            // ✅ IDs are already strings from transformResponse!
            id: String(record.blId),
            userId: record.userId ? String(record.userId) : undefined,
            title: record.title || '',
            content: record.content || '',
            excerpt: record.excerpt || '',
            images: Array.isArray(record.imageUrl)
              ? record.imageUrl.map((img: any) =>
                  typeof img === 'object' && img.imgUrl ? img.imgUrl : img
                )
              : [],
            videos: Array.isArray(record.videoUrl)
              ? record.videoUrl.map((vid: any) =>
                  typeof vid === 'object' && vid.viUrl ? vid.viUrl : vid
                )
              : [],
            author: {
              id: record.userId ? String(record.userId) : '',
              name: record.author?.nickname || 'Anonymous',
              avatar: record.author?.avatar || DEFAULT_AVATAR
            },
            date: record.createdAt || new Date().toISOString(),
            views: record.play || 0,
            likes: record.like || 0,
            isLiked: false,
            likedBy: [],
            isSaved: false,
            category: getCategoryName(record.categoryId || 1),
            categoryId: record.categoryId || 1,
            tags: record.tags || [],
            slug: record.slug || generateSlug(record.title || ''),
            isPublished: record.isPublished !== undefined ? record.isPublished : true,
            createdAt: record.createdAt || new Date().toISOString(),
            updatedAt: record.updatedAt || record.createdAt || new Date().toISOString()
          };
        });

        console.log('✅ Fetched', posts.length, 'posts');
        
        // ✅ Debug first post
        if (posts.length > 0) {
          console.log('🔍 First post ID:', posts[0].id);
          console.log('🔍 ID length:', posts[0].id.length, 'characters');
          console.log('🔍 ID type:', typeof posts[0].id);
          console.log('🔍 Category:', posts[0].category, '(from categoryId:', posts[0].categoryId, ')');
        }
        
        return posts;
      }

      return [];
    } catch (error: any) {
      console.error('❌ Fetch posts error:', error);
      return [];
    }
  } else {
    // Firebase
    const blogsRef = collection(db, BLOG_COLLECTION);
    const q = query(
      blogsRef,
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const currentUserId = auth.currentUser?.uid;

    const posts: BlogPost[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.author.id,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        images: data.images || [],
        videos: data.videos || [],
        author: data.author,
        date: timestampToString(data.createdAt),
        views: data.views || 0,
        likes: data.likes || 0,
        isLiked: currentUserId ? (data.likedBy || []).includes(currentUserId) : false,
        likedBy: data.likedBy || [],
        isSaved: false,
        category: data.category,
        categoryId: data.categoryId,
        tags: data.tags || [],
        slug: data.slug,
        isPublished: data.isPublished,
        createdAt: timestampToString(data.createdAt),
        updatedAt: timestampToString(data.updatedAt)
      };
    });

    console.log('✅ Found', posts.length, 'published posts');
    return posts;
  }
};

// ============================================================================
// GET BLOG POST BY ID
// ============================================================================

export const getBlogPostById = async (postId: string): Promise<BlogPost> => {
  console.log('📖 Fetching post:', postId);

  if (IS_CHINESE_VERSION) {
    try {
      interface BlogDetailResponse {
        code: number;
        msg: string;
        data: any;
      }

      // ✅ Use correct endpoint
      const response = await httpClient.get<BlogDetailResponse>(`/blog/get/${postId}`);

      if (response.code !== 200) {
        throw new Error(response.msg || '博客为空!');
      }

      const record = response.data;
      
      console.log('✅ Post fetched:', record.title);
      console.log('🔍 Received blId:', record.blId, 'Type:', typeof record.blId);

      return {
        // ✅ ID is already a string from transformResponse!
        id: String(record.blId),
        userId: record.userId ? String(record.userId) : '',
        title: record.title || '',
        content: record.content || '',
        excerpt: record.excerpt || '',
        images: Array.isArray(record.imageUrl)
          ? record.imageUrl.map((img: any) =>
              typeof img === 'object' && img.imgUrl ? img.imgUrl : img
            )
          : [],
        videos: Array.isArray(record.videoUrl)
          ? record.videoUrl.map((vid: any) =>
              typeof vid === 'object' && vid.viUrl ? vid.viUrl : vid
            )
          : [],
        author: {
          id: record.userId ? String(record.userId) : '',
          name: record.author?.nickname || 'Anonymous',
          avatar: record.author?.avatar || DEFAULT_AVATAR
        },
        date: record.createdAt,
        views: record.play || 0,
        likes: record.like || 0,
        isLiked: false,
        likedBy: [],
        isSaved: false,
        category: getCategoryName(record.categoryId || 1),
        categoryId: record.categoryId || 1,
        tags: record.tags || [],
        slug: record.slug || generateSlug(record.title || ''),
        isPublished: record.isPublished !== undefined ? record.isPublished : true,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        // ✅ Include comments if available
        comments: record.comment || []
      } as BlogPost & { comments: Comment[] };
    } catch (error: any) {
      console.error('❌ Fetch post error:', error);
      throw error;
    }
  } else {
    // Firebase
    const docRef = doc(db, BLOG_COLLECTION, postId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Post not found');
    }

    const data = docSnap.data();
    const currentUserId = auth.currentUser?.uid;

    return {
      id: docSnap.id,
      userId: data.author.id,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      images: data.images || [],
      videos: data.videos || [],
      author: data.author,
      date: timestampToString(data.createdAt),
      views: data.views || 0,
      likes: data.likes || 0,
      isLiked: currentUserId ? (data.likedBy || []).includes(currentUserId) : false,
      likedBy: data.likedBy || [],
      isSaved: false,
      category: data.category,
      categoryId: data.categoryId,
      tags: data.tags || [],
      slug: data.slug,
      isPublished: data.isPublished,
      createdAt: timestampToString(data.createdAt),
      updatedAt: timestampToString(data.updatedAt)
    };
  }
};

// ============================================================================
// GET USER BLOG POSTS
// ============================================================================

export const getUserBlogPosts = async (): Promise<BlogPost[]> => {
  console.log('📖 Fetching user blog posts...');

  if (IS_CHINESE_VERSION) {
    return getAllBlogPosts(); // Already uses /blog/my when authenticated
  } else {
    // Firebase
    const user = auth.currentUser;
    if (!user) {
      console.log('⚠️ No user logged in');
      return [];
    }

    const blogsRef = collection(db, BLOG_COLLECTION);
    const q = query(
      blogsRef,
      where('author.id', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    const posts: BlogPost[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.author.id,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        images: data.images || [],
        videos: data.videos || [],
        author: data.author,
        date: timestampToString(data.createdAt),
        views: data.views || 0,
        likes: data.likes || 0,
        isLiked: (data.likedBy || []).includes(user.uid),
        likedBy: data.likedBy || [],
        isSaved: false,
        category: data.category,
        categoryId: data.categoryId,
        tags: data.tags || [],
        slug: data.slug,
        isPublished: data.isPublished,
        createdAt: timestampToString(data.createdAt),
        updatedAt: timestampToString(data.updatedAt)
      };
    });

    console.log('✅ Found', posts.length, 'user posts');
    return posts;
  }
};

// ============================================================================
// GET POSTS BY CATEGORY
// ============================================================================

export const getBlogPostsByCategory = async (categorySlug: string): Promise<BlogPost[]> => {
  console.log('📂 Fetching posts by category:', categorySlug);
  
  const allPosts = await getAllBlogPosts();
  return allPosts.filter(post => post.category.toLowerCase() === categorySlug.toLowerCase());
};

// ============================================================================
// TOGGLE LIKE
// ============================================================================

export const toggleLike = async (postId: string): Promise<boolean> => {
  console.log('❤️ Toggling like for post:', postId);

  if (IS_CHINESE_VERSION) {
    // Mock for now
    return true;
  } else {
    // Firebase
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    const docRef = doc(db, BLOG_COLLECTION, postId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Post not found');
    }

    const data = docSnap.data();
    const likedBy = data.likedBy || [];
    const isLiked = likedBy.includes(user.uid);

    if (isLiked) {
      await updateDoc(docRef, {
        likes: increment(-1),
        likedBy: likedBy.filter((id: string) => id !== user.uid)
      });
      return false;
    } else {
      await updateDoc(docRef, {
        likes: increment(1),
        likedBy: [...likedBy, user.uid]
      });
      return true;
    }
  }
};

// ============================================================================
// ADD COMMENT
// ============================================================================

export const addComment = async (blogId: string, content: string, replyToId?: string): Promise<Comment> => {
  console.log('💬 Adding comment to blog ID:', blogId, '(type:', typeof blogId, ')');

  if (IS_CHINESE_VERSION) {
    try {
      interface CommentResponse {
        code: number;
        msg: string;
        data: any;
      }

      const requestBody = {
        blId: blogId,  // ✅ Send as string (already is)
        content: content,
        replyToCommentId: replyToId || undefined
      };

      console.log('📤 Sending comment request:', requestBody);

      const response = await httpClient.post<CommentResponse>('/comment/addComment', requestBody);

      if (response.code !== 200) {
        throw new Error(response.msg || 'Failed to add comment');
      }

      // Return mock comment for now
      const newComment: Comment = {
        id: Date.now().toString(),
        author: {
          name: 'Current User',
          avatar: DEFAULT_AVATAR
        },
        content,
        date: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        replies: []
      };

      console.log('✅ Comment added successfully!');
      return newComment;
    } catch (error: any) {
      console.error('❌ Add comment error:', error);
      throw error;
    }
  } else {
    // Firebase - not implemented yet
    throw new Error('Firebase comments not implemented');
  }
};