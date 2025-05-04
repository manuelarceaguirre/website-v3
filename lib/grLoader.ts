// Custom image loader for Goodreads book covers
export default function grLoader({ src, width }: { src: string; width: number }) {
  // Get the site URL, defaulting to localhost for development
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // Handle image optimization and resolution upgrades
  let optimizedSrc = src;
  
  // Common Goodreads image patterns and their transformations
  if (src) {
    // Upgrade to high resolution version - handle various patterns
    optimizedSrc = optimizedSrc
      // Size upgrades for various patterns
      .replace(/\._SX\d+_/g, `._SY475_`)
      .replace(/\._SY\d+_/g, `._SY475_`)
      .replace(/\._SX\d+SY\d+_/g, `._SY475_`)
      .replace(/\._\d+_\d+_/g, `._SY475_`)
      // Handle Amazon S3 image resizing format
      .replace(/\/\w+\d+(-?\d+)?-?_QL\d+_/g, '/SY475_')
      // Remove image quality parameters that might downscale
      .replace(/_QL\d+_/g, '')
      // Handle non-standard URLs
      .replace(/\/(S|M|P)\//g, '/L/');
  }
  
  // size parameter lets Next.js pick the right responsive width
  const url = new URL('/api/goodreads-img', siteUrl);
  url.searchParams.set('src', optimizedSrc);
  return url.toString();
} 