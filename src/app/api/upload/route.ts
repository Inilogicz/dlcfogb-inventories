import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { handleError, AppError } from '@/lib/api-error';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            throw new AppError('No file provided', 400);
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Promise<Response>((resolve) => {
            cloudinary.uploader.upload_stream(
                { folder: 'dclm_inventory' },
                (error, result) => {
                    if (error) {
                        resolve(handleError(new AppError(error.message, 500, error)));
                    } else {
                        resolve(NextResponse.json({ url: result?.secure_url }));
                    }
                }
            ).end(buffer);
        });
    } catch (error) {
        return handleError(error);
    }
}
