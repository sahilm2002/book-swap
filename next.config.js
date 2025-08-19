/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      'books.google.com',
      'covers.openlibrary.org',
      'images-na.ssl-images-amazon.com',
      'm.media-amazon.com',
      'images.booksense.com',
      'bookcoverarchive.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'books.google.com',
        port: '',
        pathname: '/books/content/**',
      },
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
}

module.exports = nextConfig
