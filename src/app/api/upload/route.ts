import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Simple file upload API
// Files are stored in 'uploads' directory (outside public for Render compatibility)
// Files are served via /api/files/[filename] route

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    // Use 'uploads' folder at root level (not in public, for Render compatibility)
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Also ensure public/uploads exists for local development
    const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(publicUploadsDir)) {
      await mkdir(publicUploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${originalName}`;
    
    // Save to both locations for compatibility
    const filepath = path.join(uploadsDir, filename);
    const publicFilepath = path.join(publicUploadsDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Write to both locations
    await Promise.all([
      writeFile(filepath, buffer),
      writeFile(publicFilepath, buffer),
    ]);

    // Return URL using our file serving API
    // This works on both local and Render
    const publicUrl = `/api/files/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
