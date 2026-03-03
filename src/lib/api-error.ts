import { NextResponse } from "next/server";
import { logger } from "./logger";

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public technicalDetails?: any
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function handleError(error: any) {
    if (error instanceof AppError) {
        logger.error(error.message, error.technicalDetails || error);
        return NextResponse.json(
            { error: error.message },
            { status: error.statusCode }
        );
    }

    // Handle generic errors
    const message = "Something went wrong";
    logger.error("Internal Server Error", error);

    return NextResponse.json(
        { error: message },
        { status: 500 }
    );
}

export function createError(message: string, statusCode: number = 500, technicalDetails?: any) {
    return new AppError(message, statusCode, technicalDetails);
}
