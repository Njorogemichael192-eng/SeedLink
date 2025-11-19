// lib/imagekit.ts
import ImageKit from "imagekit";

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

console.log("🔑 ImageKit Config Check:", {
  publicKey: publicKey ? "✅ Set" : "❌ Missing",
  privateKey: privateKey ? "✅ Set" : "❌ Missing", 
  urlEndpoint: urlEndpoint ? "✅ Set" : "❌ Missing",
});

function createDisabledShim() {
  console.log("❌ ImageKit is disabled - missing environment variables");
  return {
    async upload() {
      throw new Error(
        "ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in your environment to enable uploads."
      );
    },
  } as unknown as ImageKit;
}

export const imagekit: ImageKit =
  publicKey && privateKey && urlEndpoint
    ? new ImageKit({ publicKey, privateKey, urlEndpoint })
    : createDisabledShim();