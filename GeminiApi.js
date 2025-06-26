import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv'
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEN_KEY });

async function gemini(content){
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
    contents: `create summary of the meeting for "${content}" in more than 30 words'`,
    });
  return response.text;
}

export  {gemini};