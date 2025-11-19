// app/api/upload/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { imagekit } from "@/lib/imagekit";

export async function POST(req: Request) {
  console.log("📤 Upload API called");
  
  try {
    const form = await req.formData();
    const files = form.getAll("files");
    
    console.log(`📁 Received ${files.length} files`);
    
    if (!files.length) {
      console.log("❌ No files found");
      return NextResponse.json({ error: "No files" }, { status: 400 });
    }

    const uploads: Array<{ url: string; fileId: string }> = [];
    
    for (const f of files) {
      if (!(f instanceof File)) {
        console.log("⚠️ Skipping non-file item");
        continue;
      }

      console.log(`🔄 Processing: ${f.name} (${f.size} bytes, ${f.type})`);

      // Validate file size
      if (f.size > 10 * 1024 * 1024) {
        console.log(`❌ File too large: ${f.name}`);
        return NextResponse.json({ error: `File ${f.name} is too large. Max 10MB.` }, { status: 400 });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(f.type)) {
        console.log(`❌ Invalid file type: ${f.type}`);
        return NextResponse.json({ error: `File ${f.name} has invalid type. Allowed: JPEG, PNG, GIF, WebP` }, { status: 400 });
      }

      try {
        const arrayBuffer = await f.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        
        console.log(`☁️ Uploading to ImageKit: ${f.name}`);
        
        const uploaded = await imagekit.upload({
          file: base64,
          fileName: f.name || `upload-${Date.now()}`,
          folder: "/seedlink/posts",
          useUniqueFileName: true,
        });

        console.log(`✅ Upload successful: ${uploaded.url}`);
        
        uploads.push({ 
          url: uploaded.url, 
          fileId: uploaded.fileId 
        });

      } catch (uploadError) {
        // Log detailed error information to help debugging ImageKit failures
        try {
          console.error(`❌ Upload failed for ${f.name}:`);
          // If it's an Error, log stack; otherwise stringify
          if (uploadError instanceof Error) {
            console.error(uploadError.stack || uploadError.message);
          } else {
            console.error(JSON.stringify(uploadError, null, 2));
          }
        } catch (logErr) {
          console.error("Error while logging upload error:", logErr);
        }

        // Also log the ImageKit configuration presence (do NOT log secret values)
        console.log("🔧 ImageKit env present:", {
          hasPublicKey: !!process.env.IMAGEKIT_PUBLIC_KEY,
          hasPrivateKey: !!process.env.IMAGEKIT_PRIVATE_KEY,
          hasUrlEndpoint: !!process.env.IMAGEKIT_URL_ENDPOINT,
        });

        return NextResponse.json({ 
          error: `Failed to upload ${f.name}`,
          // Attempt to include useful details when possible
          detail: uploadError instanceof Error ? uploadError.message : typeof uploadError === 'object' ? uploadError : String(uploadError)
        }, { status: 500 });
      }
    }

    if (uploads.length === 0) {
      console.log("❌ No files uploaded successfully");
      return NextResponse.json({ error: "No files were uploaded" }, { status: 400 });
    }

    console.log(`🎉 Successfully uploaded ${uploads.length} files`);
    return NextResponse.json({ 
      success: true,
      uploads 
    });
    
  } catch (e: unknown) {
    console.error("💥 API route error:", e);
    
    const isConfigured = !!(process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT);
    
    console.log("🔧 Configuration check:", {
      hasPublicKey: !!process.env.IMAGEKIT_PUBLIC_KEY,
      hasPrivateKey: !!process.env.IMAGEKIT_PRIVATE_KEY,
      hasUrlEndpoint: !!process.env.IMAGEKIT_URL_ENDPOINT,
      isConfigured
    });

    const status = isConfigured ? 500 : 501;
    const message = e instanceof Error ? e.message : String(e);
    
    return NextResponse.json(
      { 
        error: isConfigured ? "Upload failed" : "ImageKit not configured",
        detail: message,
        configured: isConfigured
      },
      { status }
    );
  }
}