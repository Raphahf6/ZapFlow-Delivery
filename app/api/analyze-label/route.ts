import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
    const { image } = await req.json(); // base64 da imagem

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analise o rótulo deste produto de adega e retorne apenas um JSON com: { 'name': '', 'description': '', 'suggested_price': 0 }. Seja breve na descrição." },
                        { type: "image_url", image_url: { url: image } }
                    ],
                },
            ],
            response_format: { type: "json_object" }
        });

        return NextResponse.json(JSON.parse(response.choices[0].message.content || "{}"));
    } catch (error) {
        return NextResponse.json({ error: "Falha na análise" }, { status: 500 });
    }
}