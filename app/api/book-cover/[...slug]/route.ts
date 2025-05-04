import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Simple placeholder image as base64 (very small grey book icon)
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADLUlEQVR4nO2Zy0tVURTGf3p9ZL7SLDFITB+GD9AgzHCiVpYapYMGFTRoEgTRICgaNGjSpIn/QYMcNIggwogkCoeamtXN8lGiz4Gv4Dq2ts86Z92j94IXFtx7ztprffvsvdZe+0KJEiVKlJgMlAFrga/Ae2AWY4S5wGXgD6DHgUtAmTHAXOA20B8zk2PALFJEDfA6YQI9wBZSQgUwV7//BH4rbDdwjgLHReBYJN4JNOQzmTKgBbjtsNKAUNpGzuiwvUgWL4CaOPFmocclS4BmoDLSrhnYA7QK1aPAbqAmwXTqgctxE6gFLoq5XAfOAN+AV8AJ4CPwGHgEnHVM4h1Qr2gZFR3yhFqR0zHDRGeBHTnM5hywLY+JlAOvIvcui7y7Jzb7I+LdQJ2f/QR0ArMdEykDvkTs3xFZZdPcJ5dqjNj3BN4Ds4BXwrY/4dpcGxmntZ3HfZOPK7XtlDhDl6Q9vXa1GjqXJwY9HrgFbAXWKN5bJRa3qnVIjtOoXDqbM/IZ+AHcA64Cl41jLZJHHMfCUvRcHvPkQlhEZyZRHlH53WIfGC7t+6L/Lk1ir7JWrvSYgXYfzFHYuZbDuwxjdgVsU36T2KGiQ61Bj3kMXlT2yoR7D8MYXWh9OO0msfVKW7PJMHittC0yoXdPyFb/kI3lKU8DK6VJ7IiSz0/grdKPfSDVSeydC65I7U+gSgbeq3rlYQ49kr6SSVyVJrFFSj5f0zI/StQI88MXtvP+0QeI9YE+qfJoMGAr1T0MHEho+7T99hH7QI0MfFeZzyA+JfUFR+KPq3XR2g5d5tWG8aMPVC5H3n5DOw5sB04LG+aDBm1NkcM/lTQ2yk6iC/ig9NUEXJUFUplHPhgJ7ZKHejBSjjQMegZ44jngaOlRrqrKIw/MHMsBPwJXJP/PGMXfRv+pafcVCfpGU+SHU8q/J41jRkLv9YHd0qKGUdqMFRrEPO7x3Iaw2IXF8ZsRZnvFEWBZnnlgiST+4UaWBNI6v78kWaLhcP4ub65LhkH1VaQyP84FDgYogTcDx0gJs4FtZD9rDEpNtJm/+lOiRIkSJRjX+AvL+6QU+Mu31wAAAABJRU5ErkJggg==';

export async function GET(request: NextRequest, { params }: { params: { slug: string[] } }) {
  // Get image ID from slug
  const slug = params.slug || [];
  const imageId = slug.join('/');
  
  if (!imageId) {
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial" font-size="12" fill="#999" text-anchor="middle">No image</text>
      </svg>`,
      {
        headers: { 
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400' 
        }
      }
    );
  }
  
  // Full Goodreads image URL
  const imageUrl = decodeURIComponent(imageId);
  console.log('Trying to fetch:', imageUrl);
  
  try {
    // Make the fetch with necessary headers to bypass Goodreads protection
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.goodreads.com/',
        'Origin': 'https://www.goodreads.com',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      cache: 'force-cache'
    });
    
    if (!response.ok) {
      console.error(`Image fetch failed: ${response.status} ${response.statusText}`);
      
      // Return a placeholder SVG for book
      return new Response(
        `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150">
          <rect width="100%" height="100%" fill="#f0f0f0"/>
          <rect x="10" y="10" width="80" height="130" fill="#e0e0e0" rx="2" ry="2"/>
          <text x="50%" y="50%" font-family="Arial" font-size="12" fill="#999" text-anchor="middle">${imageId.split('/').pop()?.split('.')[0] || 'Book'}</text>
        </svg>`,
        {
          headers: { 
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // Get the response data
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    
    // Return the image with proper headers
    return new Response(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    
    // Return base64 placeholder image
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <rect x="10" y="10" width="80" height="130" fill="#e0e0e0" rx="2" ry="2"/>
        <text x="50%" y="75" font-family="Arial" font-size="10" fill="#999" text-anchor="middle">Error loading</text>
        <text x="50%" y="90" font-family="Arial" font-size="10" fill="#999" text-anchor="middle">cover image</text>
      </svg>`,
      {
        headers: { 
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
} 