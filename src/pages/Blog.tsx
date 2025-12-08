import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GalleryCard from '../components/GalleryCard';
import { useTranslation } from 'react-i18next';
import { useBlog } from '../contexts/BlogContext';
import { NewsletterService } from '../services/api/newsletterService';
import { CategoryService } from '../services/api/categoryService';
import { newsletterSchema, sanitizeText } from '../utils/validationSchemas';
import { useDebounce } from '../hooks/useDebounce';
import type { BlogPost } from '../types/blog';
import type { Category } from '../services/api/categoryService';


const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
  </div>
);

const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => {
  const { t } = useTranslation();
  return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg my-8 max-w-2xl mx-auto">
    <div className="flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-auto underline font-medium">
          {t('common.retry')}
        </button>
      )}
    </div>
  </div>
;}

const EmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="text-center py-12">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{t('blog.noPostsFound')}</h3>
      <p className="text-gray-500">{t('blog.tryDifferentFilters')}</p>
    </div>
  );
};

const Blog: React.FC = () => {
  const { t } = useTranslation();
  const { getBlogPostsPaginated } = useBlog();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [postsPerPage] = useState(9);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const postsRef = useRef<HTMLDivElement>(null);
  const newsletterService = new NewsletterService(import.meta.env.VITE_API_BASE_URL || '');
  const categoryService = new CategoryService(import.meta.env.VITE_API_BASE_URL || '');

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await categoryService.getCategories();
        setCategories(fetchedCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        // Fallback to default categories
        setCategories([
          { id: 1, name: 'Travel', slug: 'travel', color: '#3B82F6', icon: 'plane' },
          { id: 2, name: 'Food', slug: 'food', color: '#EF4444', icon: 'utensils' },
          { id: 3, name: 'Culture', slug: 'culture', color: '#8B5CF6', icon: 'landmark' },
          { id: 4, name: 'Adventure', slug: 'adventure', color: '#F59E0B', icon: 'mountain' },
          { id: 5, name: 'Nature', slug: 'nature', color: '#10B981', icon: 'tree' },
          { id: 6, name: 'City Guide', slug: 'city-guide', color: '#6B7280', icon: 'building' },
          { id: 7, name: 'Tips & Tricks', slug: 'tips-tricks', color: '#EC4899', icon: 'lightbulb' },
          { id: 8, name: 'Photography', slug: 'photography', color: '#6366F1', icon: 'camera' },
        ]);
      }
    };

    fetchCategories();
  }, [categoryService]);

  // Fetch blog posts with pagination
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const { posts, total } = await getBlogPostsPaginated(currentPage, postsPerPage);
        setBlogPosts(posts);
        setTotalPosts(total);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError(t('blog.errorLoadingPosts'));
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, [getBlogPostsPaginated, currentPage, postsPerPage, t]);

  // Filter and sort posts
  useEffect(() => {
    let filtered = [...blogPosts];

    // Filter by debounced search term
    if (debouncedSearchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (post.excerpt?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || false)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(post => post.category === selectedCategory || post.categoryId?.toString() === selectedCategory);
    }

    // Sort posts
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.views - a.views);
        break;
      default:
        break;
    }

    setFilteredPosts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [blogPosts, debouncedSearchTerm, selectedCategory, sortBy]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  }, [searchTerm, selectedCategory, sortBy, currentPage, setSearchParams]);

  // Show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const currentPosts = filteredPosts; // Since we load only current page, filteredPosts is the current page

  // Handle pagination
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    if (postsRef.current) {
      postsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle newsletter subscription
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterError(null);

    try {
      const sanitizedEmail = sanitizeText(email);
      const validatedData = newsletterSchema.parse({ email: sanitizedEmail });

      setNewsletterLoading(true);
      await newsletterService.subscribe(validatedData.email);
      setIsSubscribed(true);
      setEmail('');
      // Keep success message for 3 seconds
      setTimeout(() => setIsSubscribed(false), 3000);
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      if (err instanceof Error) {
        setNewsletterError(err.message);
      } else {
        setNewsletterError(t('blog.subscriptionFailed', 'Failed to subscribe. Please try again.'));
      }
    } finally {
      setNewsletterLoading(false);
    }
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Retry fetching posts
  const handleRetry = () => {
    window.location.reload();
  };

  // Translate category
  const translateCategory = (category: string) => {
    // For now, return the category name as is, or use translation keys if available
    // In a real app, you might have translation keys for each category
    return category;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showNavLinks={false} />
      
      {/* Hero Section */}
      <section className="bg-linear-to-r from-teal-700 to-teal-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('blog.title')}</h1>
            <p className="text-xl mb-8">{t('blog.subtitle')}</p>
            
            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('blog.searchPlaceholder')}
                className="w-full px-4 py-3 pr-10 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 shadow-lg"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">

        {/* Filters and Sorting */}
        <section className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t('blog.allCategories')}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.slug
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {translateCategory(category.name)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{t('blog.sortBy')}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="newest">{t('blog.newest')}</option>
              <option value="oldest">{t('blog.oldest')}</option>
              <option value="popular">{t('blog.popular')}</option>
            </select>
          </div>
        </section>

        {/* Blog Posts */}
        <section ref={postsRef} className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t('blog.allPosts')}</h2>
          
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorMessage message={error} onRetry={handleRetry} />
          ) : filteredPosts.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentPosts.map((post) => (
                  <GalleryCard
                    key={post.id}
                    id={post.id}
                    image={post.images?.[0] || ''}
                    title={post.title}
                    description={post.excerpt || ''}
                    views={post.views}
                    category={post.category}
                    date={post.date}
                    userAvatar={post.author.avatar}
                    userName={post.author.name}
                    readLink={`/blog/${post.id}`}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-md ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      aria-label={t('blog.previousPage')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-md ${
                          currentPage === page
                            ? 'bg-teal-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        aria-label={`Page ${page}`}
                        aria-current={currentPage === page ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 rounded-md ${
                        currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      aria-label={t('blog.nextPage')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </section>

        {/* Newsletter Signup */}
        <section className="bg-teal-50 rounded-lg p-8 mb-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">{t('blog.newsletterTitle')}</h2>
            <p className="text-gray-700 mb-6">{t('blog.newsletterDescription')}</p>
            
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('blog.emailPlaceholder')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {newsletterLoading ? t('blog.subscribing', 'Subscribing...') : t('blog.subscribe')}
              </button>
            </form>
            
            {newsletterError && (
              <p className="text-red-500 text-sm mt-2">{newsletterError}</p>
            )}
            
            {isSubscribed && (
              <p className="text-green-600 mt-2">{t('blog.subscriptionSuccess')}</p>
            )}
          </div>
        </section>

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-12 h-12 bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 z-50"
            aria-label={t('blog.backToTop')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Blog;