import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GalleryCard from '../components/GalleryCard';
import FeaturedBlogCard from '../components/FeaturedBlogCard';
import { useTranslation } from 'react-i18next';
import { useBlog } from '../contexts/BlogContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { NewsletterService } from '../services/api/newsletterService';
import { CategoryService } from '../services/api/categoryService';
import { newsletterSchema, sanitizeText } from '../utils/validationSchemas';
import { useDebounce } from '../hooks/useDebounce';
import { i18nErrorHandler } from '../utils/i18nErrorHandler';
import type { BlogPost } from '../types/blog';
import type { Category } from '../services/api/categoryService';

// Mock trending tags for the hero section
// TODO: add backend support
const TRENDING_TAGS = ['Japan', 'Solo Travel', 'Sustainable', 'Street Food', 'Hiking'];

// --- CSS Styles for Animations ---
const PageStyles = () => (
  <style>{`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }

    .animate-fade-in-up {
      animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0; /* Start hidden */
    }

    .skeleton-shimmer {
      animation: shimmer 2s infinite linear;
      background: linear-gradient(to right, #f3f4f6 4%, #e5e7eb 25%, #f3f4f6 36%);
      background-size: 1000px 100%;
    }

    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);

// --- Skeleton Component for Premium Loading State ---
const BlogSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-full flex flex-col">
    <div className="aspect-4/3 w-full skeleton-shimmer"></div>
    <div className="p-6 flex flex-col gap-4 flex-1">
      <div className="flex justify-between">
        <div className="h-4 w-24 bg-gray-100 rounded-full skeleton-shimmer"></div>
        <div className="h-4 w-16 bg-gray-100 rounded-full skeleton-shimmer"></div>
      </div>
      <div className="h-8 w-full bg-gray-100 rounded-lg skeleton-shimmer"></div>
      <div className="h-4 w-2/3 bg-gray-100 rounded-lg skeleton-shimmer"></div>
      <div className="mt-auto flex items-center gap-3 pt-4 border-t border-gray-50">
        <div className="w-10 h-10 rounded-full skeleton-shimmer"></div>
        <div className="h-4 w-32 bg-gray-100 rounded-full skeleton-shimmer"></div>
      </div>
    </div>
  </div>
);

const EmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 animate-fade-in-up">
      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">{t('blog.noPostsFound')}</h3>
      <p className="text-gray-500 max-w-sm mx-auto">{t('blog.tryDifferentFilters')}</p>
    </div>
  );
};

const Blog: React.FC = () => {
  const { t } = useTranslation();
  const { getBlogPostsPaginated } = useBlog();
  const { showSuccess } = useSnackbar();
  const [loading, setLoading] = useState(true);
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);

  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const postsRef = useRef<HTMLDivElement>(null);
  const newsletterService = new NewsletterService(import.meta.env.VITE_API_BASE_URL || '');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch categories
  useEffect(() => {
    const categoryService = new CategoryService(import.meta.env.VITE_API_BASE_URL || '');
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await categoryService.getCategories();
        setCategories(fetchedCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
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
  }, []);

  // Fetch blog posts
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        // Simulate a tiny delay to show off the skeleton animation even on fast networks
        const minDelay = new Promise(resolve => setTimeout(resolve, 800));
        const dataPromise = getBlogPostsPaginated(currentPage, postsPerPage);
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, { posts, total }] = await Promise.all([minDelay, dataPromise]);
        
        setBlogPosts(posts);
        setTotalPosts(total);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, [getBlogPostsPaginated, currentPage, postsPerPage, t]);

  // Filter and sort
  useEffect(() => {
    let filtered = [...blogPosts];

    if (debouncedSearchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (post.excerpt?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || false)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(post => post.category === selectedCategory || post.categoryId?.toString() === selectedCategory);
    }

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
  }, [blogPosts, debouncedSearchTerm, selectedCategory, sortBy]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());
    setSearchParams(params);
  }, [searchTerm, selectedCategory, sortBy, currentPage, setSearchParams]);

  // Scroll Progress and Back To Top
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight}`;
      
      setScrollProgress(Number(scroll));
      setShowBackToTop(totalScroll > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const isFirstPage = currentPage === 1;
  const hasPosts = filteredPosts.length > 0;
  const featuredPost = (isFirstPage && hasPosts) ? filteredPosts[0] : null;
  const gridPosts = (isFirstPage && hasPosts) ? filteredPosts.slice(1) : filteredPosts;

  const handlePageChange = (pageNumber: number) => {
    setLoading(true); // Show skeleton on page change
    setCurrentPage(pageNumber);
    if (postsRef.current) {
      postsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sanitizedEmail = sanitizeText(email);
      const validatedData = newsletterSchema.parse({ email: sanitizedEmail });
      setNewsletterLoading(true);
      await newsletterService.subscribe(validatedData.email);
      setIsSubscribed(true);
      setEmail('');
      showSuccess(t('blog.subscriptionSuccess', 'Successfully subscribed to newsletter!'));
      setTimeout(() => setIsSubscribed(false), 3000);
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      i18nErrorHandler.showErrorToUser(err, { component: 'Blog', action: 'newsletterSubscription' }, [], t.bind(t));
    } finally {
      setNewsletterLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-teal-100 selection:text-teal-900">
      <PageStyles />
      <Header showNavLinks={false} />
      
      {/* Hero Section */}
      <section className="relative h-[500px] lg:h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gray-900">
          <img 
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop" 
            alt="Travel Background" 
            className={`w-full h-full object-cover transition-all duration-[2s] ease-out ${heroImageLoaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}
            onLoad={() => setHeroImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-black/70"></div>
        </div>
         
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white font-serif tracking-tight drop-shadow-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {t('blog.title', 'Journal')}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {t('blog.subtitle')}
          </p>
          
          <div className="relative max-w-2xl mx-auto group animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full transition-opacity opacity-50 group-hover:opacity-75"></div>
            <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/30 rounded-full p-2 shadow-2xl transition-all duration-300 focus-within:bg-white/20 focus-within:border-white/50 focus-within:scale-105">
              <div className="pl-4 text-white/70">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('blog.searchPlaceholder', 'Search for destinations, tips, or stories...')}
                className="w-full px-4 py-3 bg-transparent text-white placeholder-white/70 border-none focus:ring-0 text-lg"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <span className="text-white/80 text-sm font-medium uppercase tracking-wider mr-2">Trending:</span>
            {TRENDING_TAGS.map((tag, index) => (
              <button
                key={index}
                onClick={() => setSearchTerm(tag)}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm text-white text-xs font-medium transition-all hover:-translate-y-0.5"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky Filter Bar with Scroll Progress */}
      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-300">
        {/* Scroll Progress Indicator */}
        <div 
          className="absolute top-0 left-0 h-0.5 bg-teal-600 transition-all duration-100 ease-out z-50"
          style={{ width: `${scrollProgress * 100}%` }}
        />
        
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-4">
            <div className="w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <div className="flex items-center space-x-2 min-w-max">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                    !selectedCategory
                      ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-105'
                      : 'bg-transparent text-gray-600 border-transparent hover:bg-gray-100'
                  }`}
                >
                  {t('blog.allCategories')}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.slug)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border whitespace-nowrap ${
                      selectedCategory === category.slug
                        ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-105'
                        : 'bg-transparent text-gray-600 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 hidden md:inline">{t('blog.sortBy')}</span>
              <div className="relative group">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-transparent pl-2 pr-8 py-1 text-sm font-medium text-gray-700 focus:outline-none cursor-pointer hover:text-teal-600 transition-colors"
                >
                  <option value="newest">{t('blog.newest')}</option>
                  <option value="oldest">{t('blog.oldest')}</option>
                  <option value="popular">{t('blog.popular')}</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 md:py-16" ref={postsRef}>
        
        {loading ? (
          /* Loading State using Skeleton Grid */
          <div className="animate-fade-in-up">
            {/* Featured Skeleton */}
            <div className="mb-12 h-[400px] w-full bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row">
              <div className="lg:w-1/2 h-64 lg:h-full skeleton-shimmer"></div>
              <div className="lg:w-1/2 p-10 flex flex-col justify-center space-y-4">
                <div className="h-6 w-32 bg-gray-100 rounded skeleton-shimmer"></div>
                <div className="h-10 w-full bg-gray-100 rounded skeleton-shimmer"></div>
                <div className="h-4 w-full bg-gray-100 rounded skeleton-shimmer"></div>
                <div className="h-4 w-2/3 bg-gray-100 rounded skeleton-shimmer"></div>
              </div>
            </div>
            
            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <BlogSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : !hasPosts ? (
          <EmptyState />
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <section className="mb-16 animate-fade-in-up" style={{ animationDelay: '0s' }}>
                <div className="flex items-center gap-4 mb-6">
                  <span className="h-px bg-gray-200 flex-1"></span>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('blog.featured', 'Editor\'s Pick')}</span>
                  <span className="h-px bg-gray-200 flex-1"></span>
                </div>
                <FeaturedBlogCard post={featuredPost} />
              </section>
            )}

            {/* Grid Posts */}
            <section>
               {featuredPost && <h2 className="text-2xl font-bold font-serif mb-8 text-gray-900 animate-fade-in-up">{t('blog.latestStories', 'Latest Stories')}</h2>}
              {gridPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                  {gridPosts.map((post, index) => (
                    <div 
                      key={post.id} 
                      className="animate-fade-in-up h-full" 
                      style={{ animationDelay: `${index * 100}ms` }} // Staggered Animation
                    >
                      <GalleryCard
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
                    </div>
                  ))}
                </div>
              ) : !featuredPost && (
                <EmptyState />
              )}
            </section>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-20 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <nav className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-teal-600'
                    }`}
                    aria-label={t('blog.previousPage')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-teal-600'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-teal-600'
                    }`}
                    aria-label={t('blog.nextPage')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </nav>
              </div>
            )}
          </>
        )}

        {/* Newsletter Section */}
        <section className="mt-24 relative overflow-hidden bg-white rounded-3xl shadow-xl border border-gray-100 group animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
           <div className="absolute top-0 right-0 w-80 h-80 bg-teal-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 transition-transform duration-700 group-hover:scale-110"></div>
           <div className="absolute bottom-0 left-0 w-60 h-60 bg-orange-100/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 transition-transform duration-700 group-hover:scale-110"></div>
           
           <div className="relative z-10 p-8 md:p-16 text-center max-w-3xl mx-auto">
            <span className="text-teal-600 font-bold tracking-widest text-xs uppercase mb-4 block">{t('blog.newsletter')}</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif text-gray-900 leading-tight">
              {t('blog.newsletterTitle', 'Travel Inspiration in Your Inbox')}
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg font-light">
              {t('blog.newsletterDescription', 'Join 25,000+ travelers. Get weekly itineraries, hidden gems, and exclusive guides.')}
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('blog.emailPlaceholder')}
                className="flex-1 px-6 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50/50 focus:bg-white transition-all shadow-inner"
                required
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="px-8 py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-lg hover:shadow-teal-500/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {newsletterLoading ? t('blog.subscribing', 'Joining...') : t('blog.subscribe')}
              </button>
            </form>
            
            {isSubscribed && (
              <div className="mt-6 p-3 bg-green-50 text-green-700 rounded-lg inline-block text-sm font-medium animate-fade-in-up border border-green-100">
                <span className="mr-2">✓</span> {t('blog.subscriptionSuccess')}
              </div>
            )}
            
            <p className="mt-6 text-xs text-gray-400">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>
        </section>

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-14 h-14 bg-white text-teal-600 border border-teal-100 rounded-full shadow-xl flex items-center justify-center hover:bg-teal-50 hover:scale-110 transition-all focus:outline-none z-50 group animate-fade-in-up"
            aria-label={t('blog.backToTop')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-y-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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