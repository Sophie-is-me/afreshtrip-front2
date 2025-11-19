import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ImageCarousel from '../components/ImageCarousel';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';
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
import type { BlogPost, Comment } from '../types/blog';

const BlogDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { blogPosts, updatePostStatistics, getRelatedPosts } = useBlog();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  // Fetch blog post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);

        const foundPost = blogPosts.find(p => p.id === id);
        if (foundPost) {
          setPost(foundPost);
          setIsLiked(foundPost.isLiked || false);
          setIsSaved(foundPost.isSaved || false);

          // Get related posts
          const related = getRelatedPosts(foundPost.id, foundPost.category);
          setRelatedPosts(related);

          // Fetch comments (mock data for now)
          setComments([
            {
              id: '1',
              author: {
                name: 'John Doe',
                avatar: 'https://picsum.photos/seed/user1/100/100.jpg'
              },
              content: 'Great article! I really enjoyed reading this and learned a lot.',
              date: '2023-05-15',
              likes: 5,
              isLiked: false
            },
            {
              id: '2',
              author: {
                name: 'Jane Smith',
                avatar: 'https://picsum.photos/seed/user2/100/100.jpg'
              },
              content: 'Thanks for sharing this. I have a question about the third point...',
              date: '2023-05-16',
              likes: 2,
              isLiked: true,
              replies: [
                {
                  id: '2-1',
                  author: {
                    name: 'Blog Author',
                    avatar: 'https://picsum.photos/seed/author/100/100.jpg'
                  },
                  content: 'Great question! Let me clarify that point for you...',
                  date: '2023-05-17',
                  likes: 1,
                  isLiked: false
                }
              ]
            }
          ]);
        } else {
          setError(t('blog.blogPostNotFound'));
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError(t('blog.errorLoadingPost'));
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [blogPosts, id, t, getRelatedPosts]);

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
    
    setIsLiked(!isLiked);
    updatePostStatistics(id, { 
      likes: isLiked ? post.likes - 1 : post.likes + 1,
      isLiked: !isLiked
    });
  };

  // Handle save
  const handleSave = () => {
    if (!post || !id) return;
    
    setIsSaved(!isSaved);
    updatePostStatistics(id, { 
      isSaved: !isSaved
    });
  };

  // Handle add comment
  const handleAddComment = async (comment: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const newComment: Comment = {
      id: Date.now().toString(),
      author: {
        name: user.displayName || user.email || 'Anonymous',
        avatar: user.photoURL || 'https://picsum.photos/seed/default/100/100.jpg'
      },
      content: comment,
      date: new Date().toISOString(),
      likes: 0,
      isLiked: false
    };
    
    setComments([newComment, ...comments]);
  };

  // Handle like comment
  const handleLikeComment = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked
        };
      }
      return comment;
    }));
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

  // Retry fetching post
  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} onRetry={handleRetry} />;
  if (!post) return null; // Should not happen

  const currentUrl = window.location.href;
  const readingTime = calculateReadingTime(post.content);

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
            />
          )}

          {/* Content and Table of Contents */}
          <div className={`grid gap-8 mt-8 ${showTableOfContents ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'}`}>
            <div className={showTableOfContents ? 'lg:col-span-3' : ''}>
              <div
                ref={contentRef}
                className="prose prose-lg max-w-none mb-8"
                dangerouslySetInnerHTML={{ __html: post.content }}
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
            onAddComment={handleAddComment}
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