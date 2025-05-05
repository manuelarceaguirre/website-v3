// Custom image loader for Goodreads book covers
export default function grLoader({ src, width }: { src: string; width: number }) {
  // Get the site URL, defaulting to localhost for development
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // Store original URL for fallback
  const originalSrc = src;
  
  // Handle image optimization and resolution upgrades
  let optimizedSrc = src;
  
  // Common Goodreads image patterns and their transformations
  if (src) {
    // More conservative approach to URL transformations
    optimizedSrc = optimizedSrc
      // Handle non-standard URLs (e.g., S/M/P size folders)
      .replace(/\/(S|M|P)\//g, '/L/')
      // Remove explicit size folders like /75x75/
      .replace(/\/\d+x\d+\//g, '/'); 
    
    // Handle quality parameters more conservatively
    if (optimizedSrc.includes('_QL')) {
      optimizedSrc = optimizedSrc.replace(/_QL\d+_/g, '');
    }
    
    // Remove trailing underscores that might be left after replacements
    optimizedSrc = optimizedSrc.replace(/_\./g, '.');
  }
  
  // Use the updated image-proxy endpoint
  const url = new URL('/api/image-proxy', siteUrl);
  // Pass both the (potentially optimized) URL and the original
  url.searchParams.set('url', optimizedSrc);
  url.searchParams.set('original', originalSrc);
  // Title is passed by Book component now, no need to pass here
  // url.searchParams.set('title', title); 
  
  return url.toString();
} 