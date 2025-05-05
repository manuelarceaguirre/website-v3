# Michelle's Website TODO List

## Completed
- [x] Update website content with Michelle's personal information
- [x] Change "Philipp" to "Michelle" throughout the site
- [x] Update section headers and descriptions
- [x] Add Goodreads integration in the "lost in pages" section
- [x] Configure next.config.mjs to allow Goodreads images
- [x] Implement improved Goodreads image proxy with edge runtime and caching
- [x] Fix image loading issues and improve resolution for book covers
- [x] Remove "Recently finished" books section
- [x] Update profile picture/logo with improved appearance and responsive scaling
- [x] Replace Rive animations with image cards in section slides
- [x] Redesign image cards to be smaller, tilted with interactive hover effects
- [x] Optimize website performance for snappier interactions
- [x] Fix build errors and optimize image processing with sharp
- [x] Enable advanced CSS optimization with critters
- [x] Configure website to always use light mode and remove theme toggle
- [x] Fix missing book covers with custom fallback images
- [x] Fix inconsistent book cover display between local and Vercel environments
  - [x] Stop over-rewriting image URLs with excessive size transformations (Initial Pass)
  - [x] Merge the two image proxy routes and broaden the allowed hosts list
  - [x] Implement early detection of bad fetches with fallback to original URL
  - [x] Handle "no cover available" cases more gracefully
- [x] Resolve 403 Forbidden errors from Goodreads CDN (`i.gr-assets.com`) - Attempt 1 (Header Patch)
- [x] Prevent 404 errors caused by forcing `_SY475_` image size - Attempt 1 (Remove Forced Size)
- [x] Resolve persistent 403 Forbidden errors from Goodreads CDN
  - [x] Pass full book page URL as `Referer` header in image proxy request
  - [x] Remove `Origin` header from image proxy fetch request
- [x] Ensure no forced `_SY475_` size transformation occurs
  - [x] Remove any remaining size upgrade logic in `grLoader.ts`
  - [x] Verify `enhanceGoodreadsImageUrl` does not force sizes
- [x] Fix Goodreads RSS feed parsing in `/api/goodreads`
  - [x] Install `rss-parser` library
  - [x] Refactor API route to use `rss-parser` instead of Regex
    - [x] Remove `export const runtime = 'edge';` to use Node.js runtime
  - [ ] (Optional) Implement size availability check before requesting larger images

## In Progress
- [ ] Add appropriate images for each section card
- [ ] Test Goodreads integration (currently reading only)
- [ ] Verify responsive design of book shelf (currently reading only)

## To Do
- [ ] Set environment variable NEXT_PUBLIC_SITE_URL in production
- [ ] Add additional content or sections if needed
- [ ] Verify all links in navigation are updated
- [ ] Test on different devices/browsers
- [ ] Deploy to a hosting platform
- [ ] Set up custom domain if desired

## Future Enhancements
- [ ] Add more interactive elements
- [ ] Integrate additional APIs (e.g., Spotify for music, GitHub for code projects)
- [ ] Create a blog section
- [ ] Add more detailed about page

## Book Cover Issues - Debug Checklist
1. Check JSON response from `/api/goodreads` to see if cover URL is empty **(Fixed!)**
2. Open the cover URL directly to check if it returns a 404
3. Check Edge logs for `/api/image-proxy` for error codes:
   - 403: Hot-link blocking by Goodreads (Needs header patch) - Fixed with Referer/Origin adjustment.
   - 404: Wrong size parameter or missing image (Needs size transformation fix) - Fixed by removing transformations.
   - Other errors: Network issues
4. Add missing hosts to `ALLOWED_HOSTS` or relax allow-list 