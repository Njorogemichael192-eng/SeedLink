import { NextResponse } from "next/server";
import { imagekit } from "@/lib/imagekit";

export async function GET() {
  try {
    const authParams = imagekit.getAuthenticationParameters();
    return NextResponse.json(authParams);
  } catch {
    return NextResponse.json({ error: "ImageKit auth failed" }, { status: 500 });
  }
}
