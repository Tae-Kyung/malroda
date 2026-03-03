import { NextResponse } from 'next/server';
import { openai } from '@/lib/services/openai';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
        }

        console.log(`[Speech-to-Text]: Processing audio file, size: ${audioFile.size} bytes`);

        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "ko", // Default to Korean, Whisper auto-detects if needed
        });

        console.log(`[Speech-to-Text]: Transcription result: "${transcription.text}"`);

        return NextResponse.json({ text: transcription.text }, { status: 200 });
    } catch (error: any) {
        console.error("[Speech-to-Text Error]:", error);
        return NextResponse.json({
            error: error.message || "Failed to transcribe audio"
        }, { status: 500 });
    }
}
