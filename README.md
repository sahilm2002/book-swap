# Book Swap Platform

A modern book swapping platform built with Next.js, Supabase, and Tailwind CSS.

## Features

- User authentication and profiles
- Add, browse, and manage books
- Book cover fetching from Google Books API
- Rating and review system
- Swap requests and management
- Responsive design with "Books & Booze" theme

## Book Cover Fetching

The platform automatically fetches book covers from Google Books API when users add books. This feature includes:

### Configuration

1. **Get a Google Books API Key**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Google Books API
   - Create credentials (API Key)
   - Add the key to your environment variables

2. **Environment Variables**:
   ```bash
   # Required for book cover fetching
   NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY=your_api_key_here
   
   # Optional configuration
   BOOK_COVERS_CONCURRENCY=3          # Max concurrent requests
   BOOK_COVERS_CACHE_TTL=3600000     # Cache TTL in milliseconds (1 hour)
   BOOK_COVERS_MAX_RETRIES=3         # Max retry attempts
   BOOK_COVERS_RETRY_DELAY=1000      # Base retry delay in milliseconds
   ```

### Features

- **Rate Limiting**: Configurable concurrency limits to respect API quotas
- **Retry Logic**: Exponential backoff with jitter for failed requests
- **Caching**: In-memory cache to avoid repeated requests for the same book
- **Error Handling**: Graceful fallbacks and comprehensive error logging
- **Batch Processing**: Efficient batch fetching for multiple books

### Security

- API keys are read from environment variables
- Rate limiting prevents abuse
- User-Agent headers for request identification
- Secure error handling without exposing sensitive information

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `env.example` to `.env.local` and fill in your configuration
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Database Setup

1. Run the SQL scripts in the correct order:
   - `common-triggers.sql` (shared functions)
   - `database-schema.sql` (core tables)
   - `book-reviews-schema.sql` (review system)

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License.
