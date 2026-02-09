// src/services/blogApi.ts
// ✅ FIXED: Prevents double view count

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
import type { BlogPost, CreateBlogPostInput } from '../types/blog';

const BLOG_COLLECTION = 'blogs';

// ✅ Track which posts we've already incremented views for (session-based)
const viewedPosts = new Set<string>();

const timestampToString = (timestamp: any): string => {
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return new Date().toISOString();
};

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const getCategoryName = (categoryId: number): string => {
  const categories: Record<number, string> = {
    1: 'Adventure',
    2: 'Culture',
    3: 'Food',
    4: 'Travel'
  };
  return categories[categoryId] || 'General';
};

const getCategoryNameFromSlug = (slug: string): string => {
  const slugMap: Record<string, string> = {
    'adventure': 'Adventure',
    'culture': 'Culture',
    'food': 'Food',
    'travel': 'Travel'
  };
  return slugMap[slug.toLowerCase()] || '';
};

export const uploadBlogImage = async (file: File): Promise<string> => {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User must be authenticated to upload images');
  }

  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const uploadPath = `blogs/${user.uid}/${fileName}`;
  const storageRef = ref(storage, uploadPath);
  
  console.log('📤 Uploading image to:', uploadPath);
  
  await uploadBytes(storageRef, file, {
    contentType: file.type
  });
  
  const downloadURL = await getDownloadURL(storageRef);
  console.log('✅ Image uploaded:', downloadURL);
  
  return downloadURL;
};

export const createBlogPost = async (input: CreateBlogPostInput): Promise<string> => {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User must be authenticated to create posts');
  }

  const categoryName = getCategoryName(input.categoryId);
  const slug = generateSlug(input.title);

  console.log('✨ Creating blog post...');

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
      avatar: user.photoURL || ''
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    date: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, BLOG_COLLECTION), postData);
  
  console.log('✅ Post created with ID:', docRef.id);
  return docRef.id;
};

export const getAllBlogPosts = async (): Promise<BlogPost[]> => {
  console.log('📖 Fetching all published blog posts...');
  
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
};

export const getBlogPostsByCategory = async (categorySlug: string): Promise<BlogPost[]> => {
  console.log('📖 Fetching posts in category:', categorySlug);
  
  const categoryName = getCategoryNameFromSlug(categorySlug);
  
  if (!categoryName) {
    console.warn('⚠️ Unknown category slug:', categorySlug);
    return [];
  }
  
  const blogsRef = collection(db, BLOG_COLLECTION);
  const q = query(
    blogsRef,
    where('category', '==', categoryName),
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const currentUserId = auth.currentUser?.uid;
  
  const posts: BlogPost[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
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

  console.log('✅ Found', posts.length, 'posts in category', categoryName);
  return posts;
};

// ✅ FIXED: Prevent double view increment with session tracking
export const getBlogPostById = async (postId: string, skipViewIncrement: boolean = false): Promise<BlogPost | null> => {
  console.log('📖 Fetching post:', postId);
  
  const docRef = doc(db, BLOG_COLLECTION, postId);
  
  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.warn('⚠️ Post not found:', postId);
      return null;
    }

    const data = docSnap.data();
    const currentUserId = auth.currentUser?.uid;

    // ✅ Only increment if not already viewed in this session AND not explicitly skipped
    if (!skipViewIncrement && !viewedPosts.has(postId)) {
      try {
        await updateDoc(docRef, {
          views: increment(1)
        });
        viewedPosts.add(postId); // Mark as viewed
        console.log('✅ View count incremented');
      } catch (viewError) {
        console.warn('⚠️ Could not increment views (guest user)');
      }
    } else if (viewedPosts.has(postId)) {
      console.log('ℹ️ Post already viewed in this session, skipping increment');
    }

    const post: BlogPost = {
      id: docSnap.id,
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

    console.log('✅ Post loaded:', post.title);
    return post;
    
  } catch (error) {
    console.error('❌ Error fetching post:', error);
    throw error;
  }
};

export const getUserBlogPosts = async (): Promise<BlogPost[]> => {
  const user = auth.currentUser;
  
  if (!user) {
    console.warn('⚠️ No user logged in');
    return [];
  }

  console.log('📖 Fetching user posts for:', user.uid);
  
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
};

export const updateBlogPost = async (
  postId: string,
  updates: Partial<CreateBlogPostInput>
): Promise<void> => {
  console.log('📝 Updating post:', postId);

  const docRef = doc(db, BLOG_COLLECTION, postId);
  
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
};

export const deleteBlogPost = async (postId: string): Promise<void> => {
  console.log('🗑️ Deleting post:', postId);
  
  const docRef = doc(db, BLOG_COLLECTION, postId);
  await deleteDoc(docRef);
  
  console.log('✅ Post deleted');
};

export const toggleLike = async (postId: string): Promise<boolean> => {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User must be logged in to like posts');
  }

  const userId = user.uid;
  const docRef = doc(db, BLOG_COLLECTION, postId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Post not found');
  }

  const data = docSnap.data();
  const likedBy = data.likedBy || [];
  const isLiked = likedBy.includes(userId);

  if (isLiked) {
    console.log('💔 Unliking post:', postId);
    await updateDoc(docRef, {
      likes: increment(-1),
      likedBy: likedBy.filter((id: string) => id !== userId)
    });
    return false;
  } else {
    console.log('❤️ Liking post:', postId);
    await updateDoc(docRef, {
      likes: increment(1),
      likedBy: [...likedBy, userId]
    });
    return true;
  }
};

export const isPostLikedByUser = (post: BlogPost): boolean => {
  if (!auth.currentUser) return false;
  return (post.likedBy || []).includes(auth.currentUser.uid);
};

export {
  getCategoryName,
  getCategoryNameFromSlug,
  generateSlug,
  timestampToString
};
