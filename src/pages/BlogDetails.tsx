// src/pages/BlogDetails.tsx
// ✅ COMPLETE FIX: SEO URLs + String IDs + Default Avatar

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ImageCarousel from '../components/ImageCarousel';
import LoadingSkeleton from '../components/LoadingSkeleton';
import TableOfContents from '../components/TableOfContents';
import SocialShareButtons from '../components/SocialShareButtons';
import CommentSection from '../components/CommentSection';
import Breadcrumbs from '../components/Breadcrumbs';
import BlogPostActions from '../components/BlogPostActions';
import BlogPostMeta from '../components/BlogPostMeta';
import AuthorBio from '../components/AuthorBio';
import RelatedPosts from '../components/RelatedPosts';
import Lightbox from '../components/Lightbox';
import BackToTopButton from '../components/BackToTopButton';
import { useBlog } from '../contexts/BlogContext';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { createSanitizedHtml } from '../utils/sanitizeHtml';
import { commentSchema, sanitizeText } from '../utils/validationSchemas';
import { i18nErrorHandler } from '../utils/i18nErrorHandler';
import type { BlogPost, Comment } from '../types/blog';

// TipTap imports for HTML generation
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';

const BlogDetails: React.FC = () => {
  // ✅ Get both ID and slug from URL params
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { updatePostStatistics, getRelatedPosts, getBlogDetails, toggleCommentLike, addComment } = useBlog();
  const { user } = useAuth();
  const { showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showTableOfContents, setShowTableOfContents] = useState(false);

  // Calculate reading time
  const calculateReadingTime = (html: string) => {
    const wordsPerMinute = 200;
    const text = html.replace(/<[^>]*>/g, '').trim();
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    return Math.ceil(words / wordsPerMinute);
  };

  // Fetch blog post
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        console.error('❌ No blog ID in URL');
        navigate('/blog');
        return;
      }

      console.log('🔍 BlogDetails - Fetching post with ID:', id);
      console.log('🔍 ID type:', typeof id);
      console.log('🔍 ID length:', id.length, 'characters');
      console.log('🔍 URL slug:', slug);

      try {
        setLoading(true);

        // ✅ Fetch using string ID
        const { post: fetchedPost, comments: fetchedComments } = await getBlogDetails(id);
        
        console.log('✅ Post fetched:', fetchedPost.title);
        console.log('✅ Post ID from API:', fetchedPost.id);
        console.log('✅ Post slug:', fetchedPost.slug);
        
        setPost(fetchedPost);
        setIsLiked(fetchedPost.isLiked || false);
        setIsSaved(fetchedPost.isSaved || false);

        // ✅ Update URL with slug if missing (SEO optimization)
        if (fetchedPost.slug && slug !== fetchedPost.slug) {
          console.log('🔄 Updating URL with correct slug:', fetchedPost.slug);
          navigate(`/blog/${id}/${fetchedPost.slug}`, { replace: true });
        }

        // Get related posts
        const related = getRelatedPosts(fetchedPost.id, fetchedPost.category);
        setRelatedPosts(related);

        // Set comments from API
        setComments(fetchedComments);
        
        console.log('✅ Page fully loaded!');
      } catch (err) {
        console.error('❌ Error fetching blog post:', err);
        i18nErrorHandler.showErrorToUser(
          err,
          { component: 'BlogDetails', action: 'fetchPost' },
          [
            {
              label: t('common.retry'),
              onClick: () => window.location.reload(),
              style: 'primary'
            }
          ],
          t.bind(t)
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, slug, navigate, t, getBlogDetails, getRelatedPosts]);

  // Extract headings for table of contents after content is rendered
  useEffect(() => {
    if (post && contentRef.current) {
      const headingElements = contentRef.current.querySelectorAll('h2, h3, h4');
      const extractedHeadings = Array.from(headingElements).map((heading, index) => ({
        id: `heading-${index}`,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.substring(1))
      }));
      setHeadings(extractedHeadings);
      setShowTableOfContents(extractedHeadings.length > 0);

      // Add IDs to headings
      headingElements.forEach((heading, index) => {
        heading.id = `heading-${index}`;
      });
    }
  }, [post]);

  // Show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle like
  const handleLike = () => {
    if (!post || !id) return;
    
    console.log('❤️ Toggling like for post:', id);
    setIsLiked(!isLiked);
    updatePostStatistics(id, { 
      likes: isLiked ? post.likes - 1 : post.likes + 1,
      isLiked: !isLiked
    });
  };

  // Handle save
  const handleSave = () => {
    if (!post || !id) return;
    
    console.log('📌 Toggling save for post:', id);
    setIsSaved(!isSaved);
    updatePostStatistics(id, { 
      isSaved: !isSaved
    });
  };

  // Handle add comment
  const handleAddComment = async (comment: string, replyToId?: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!id) {
      console.error('❌ No blog ID for comment');
      return;
    }

    console.log('💬 Adding comment to blog ID:', id, '(type:', typeof id, ')');
    console.log('💬 Reply to:', replyToId);

    try {
      // Validate and sanitize comment
      const sanitizedComment = sanitizeText(comment);
      commentSchema.parse(sanitizedComment);

      // ✅ Call API with STRING ID
      const newComment = await addComment(id, sanitizedComment, replyToId);

      // Add the new comment to the list
      setComments(prevComments => [newComment, ...prevComments]);
      showSuccess(t('blog.commentAdded', 'Comment added successfully!'));
      
      console.log('✅ Comment added successfully!');
    } catch (err: any) {
      console.error('❌ Failed to add comment:', err);
      console.error('   Error message:', err.message);
      
      i18nErrorHandler.showErrorToUser(
        err,
        { component: 'BlogDetails', action: 'addComment' },
        [],
        t.bind(t)
      );
    }
  };

  // Handle like comment
  const handleLikeComment = async (commentId: string) => {
    try {
      const isLiked = await toggleCommentLike(commentId);
      setComments(prevComments => updateCommentLikes(prevComments, commentId, isLiked));
    } catch (err) {
      console.error('Error liking comment:', err);
      i18nErrorHandler.showErrorToUser(
        err,
        { component: 'BlogDetails', action: 'likeComment' },
        [],
        t.bind(t)
      );
    }
  };

  // Helper to update comment likes recursively
  const updateCommentLikes = (comments: Comment[], commentId: string, isLiked: boolean): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: isLiked ? comment.likes + 1 : comment.likes - 1,
          isLiked
        };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentLikes(comment.replies, commentId, isLiked)
        };
      }
      return comment;
    });
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSkeleton />;
  if (!post) return null;

  const currentUrl = window.location.href;

  // Generate HTML from TipTap JSON or use existing HTML
  const contentHtml = (() => {
    try {
      const json = JSON.parse(post.content);
      return generateHTML(json, [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        ImageExtension,
        LinkExtension.configure({ openOnClick: false }),
      ]);
    } catch {
      return post.content;
    }
  })();

  const readingTime = calculateReadingTime(contentHtml);

  return (
    <div className="min-h-screen bg-white">
      <Header showToolbar showNavLinks={false} />
      
      <Breadcrumbs
        items={[
          { label: t('common.home'), href: '/' },
          { label: t('blog.blog'), href: '/blog' },
          { label: post.title }
        ]}
      />

      <main className="px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <BlogPostActions
            onPrint={handlePrint}
            onLike={handleLike}
            onSave={handleSave}
            isLiked={isLiked}
            isSaved={isSaved}
          />

          <BlogPostMeta
            post={post}
            readingTime={readingTime}
            isLiked={isLiked}
          />

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <ImageCarousel
              images={post.images}
              altPrefix={post.title}
              onImageClick={setLightboxImage}
              responsiveImages={true}
            />
          )}

          {/* Content and Table of Contents */}
          <div className={`grid gap-8 mt-8 ${showTableOfContents ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'}`}>
            <div className={showTableOfContents ? 'lg:col-span-3' : ''}>
              <div
                ref={contentRef}
                className="prose prose-lg max-w-none mb-8"
                dangerouslySetInnerHTML={createSanitizedHtml(contentHtml)}
              />
            </div>

            {showTableOfContents && (
              <div className="lg:col-span-1">
                <TableOfContents headings={headings} />
              </div>
            )}
          </div>

          {/* Social Share */}
          <SocialShareButtons
            url={currentUrl}
            title={post.title}
            description={post.excerpt || ''}
          />

          <AuthorBio author={post.author} />

          {/* Comments Section */}
          <CommentSection
            comments={comments}
            onAddComment={(comment, replyToId) => handleAddComment(comment, replyToId)}
            onLikeComment={handleLikeComment}
          />

          <RelatedPosts posts={relatedPosts} />
        </div>
      </main>

      <Lightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

      <BackToTopButton
        visible={showBackToTop}
        onClick={scrollToTop}
      />

      <Footer />
    </div>
  );
};

export default BlogDetails;
