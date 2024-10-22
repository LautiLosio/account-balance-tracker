/** @type {import('next').NextConfig} */
const nextConfig = {
//   Error: Invalid src prop (https://s.gravatar.com/avatar/1db83959c4739aac34c3fece19a12bbe?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fla.png) on `next/image`, hostname "s.gravatar.com" is not configured under images in your `next.config.js`
// Error: Invalid src prop (https://lh3.googleusercontent.com/a/ACg8ocKyPjYuvIRG4FUHTveeZaHgW8Auj8wJ2CguNBmIQnCHDvPIyISzFw=s96-c) on `next/image`, hostname "lh3.googleusercontent.com" is not configured under images in your `next.config.js`

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.gravatar.com",
      },
      { 
        protocol: "https",
        hostname: "*.googleusercontent.com",
      }
    ],
  },
};

export default nextConfig;
