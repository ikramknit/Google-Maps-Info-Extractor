import { GoogleGenAI } from "@google/genai";
import type { BusinessInfo } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const extractInfoFromUrl = async (url: string): Promise<BusinessInfo[]> => {
  if (!url || !url.includes('google.com/maps')) {
    throw new Error('Please provide a valid Google Maps URL.');
  }

  try {
    const prompt = `Your task is to extract business information from a Google Maps URL: ${url}.
First, use Google Search to find all business listings at that URL.
Then, for each business found, perform a targeted search to find its official name, full street address, and primary phone number. If multiple phone numbers are listed, please return only the first or most prominent one.
Return a JSON array where each object contains "name", "address", and "phone".
If a detail for a business is unavailable, use the string "N/A".
Provide only the raw JSON array in your response.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    let text = response.text.trim();
    
    // The model might return the JSON wrapped in markdown ```json ... ```
    if (text.startsWith('```json')) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith('```')) {
      text = text.substring(3, text.length - 3).trim();
    }
    
    const parsedJson = JSON.parse(text);

    if (!Array.isArray(parsedJson)) {
      // If the model returns a single object, wrap it in an array for consistency
      if (typeof parsedJson === 'object' && parsedJson !== null && parsedJson.name) {
           const business: BusinessInfo = {
              name: parsedJson.name || 'N/A',
              address: parsedJson.address || 'N/A',
              phone: parsedJson.phone || 'N/A',
          };
          // Return array with the item if phone is valid, otherwise empty array
          return business.phone && business.phone.trim() !== 'N/A' && business.phone.trim() !== '' ? [business] : [];
      }
      console.warn("Gemini API did not return an array. Response:", parsedJson);
      throw new Error("The AI's response was not in the expected format (an array of businesses).");
    }

    return parsedJson.map(item => ({
        name: item.name || 'N/A',
        address: item.address || 'N/A',
        phone: item.phone || 'N/A',
    })).filter(business => business.phone && business.phone.trim() !== 'N/A' && business.phone.trim() !== '');
  } catch (error) {
    console.error("Error processing Gemini API response:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Failed to parse the AI's response. The format was unexpected.");
    }
    if (error instanceof Error && error.message.startsWith("The AI's response was not in the expected format")) {
      throw error;
    }
    throw new Error("Failed to extract information. The URL might be invalid, not publicly accessible, or the service is temporarily unavailable.");
  }
};

export const extractInfoFromText = async (text: string): Promise<BusinessInfo[]> => {
  if (!text.trim()) {
    throw new Error('Please paste some text to extract from.');
  }

  try {
    const prompt = `Your task is to extract business information from the following text data which was copied from Google Maps:\n\n---\n${text}\n---\n\nFor each business found in the text, extract its official name, full street address, and primary phone number. If multiple phone numbers are listed, please return only the first or most prominent one.
Return a JSON array where each object contains "name", "address", and "phone".
If a detail for a business is unavailable, use the string "N/A".
Provide only the raw JSON array in your response.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let responseText = response.text.trim();
    
    if (responseText.startsWith('```json')) {
      responseText = responseText.substring(7, responseText.length - 3).trim();
    } else if (responseText.startsWith('```')) {
        responseText = responseText.substring(3, responseText.length - 3).trim();
    }
    
    const parsedJson = JSON.parse(responseText);

    if (!Array.isArray(parsedJson)) {
      if (typeof parsedJson === 'object' && parsedJson !== null && parsedJson.name) {
           const business: BusinessInfo = {
              name: parsedJson.name || 'N/A',
              address: parsedJson.address || 'N/A',
              phone: parsedJson.phone || 'N/A',
          };
          return business.phone && business.phone.trim() !== 'N/A' && business.phone.trim() !== '' ? [business] : [];
      }
      console.warn("Gemini API did not return an array. Response:", parsedJson);
      throw new Error("The AI's response was not in the expected format (an array of businesses).");
    }

    return parsedJson.map(item => ({
        name: item.name || 'N/A',
        address: item.address || 'N/A',
        phone: item.phone || 'N/A',
    })).filter(business => business.phone && business.phone.trim() !== 'N/A' && business.phone.trim() !== '');
  } catch (error) {
    console.error("Error processing Gemini API response from text:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Failed to parse the AI's response. The format was unexpected.");
    }
    if (error instanceof Error && error.message.startsWith("The AI's response was not in the expected format")) {
      throw error;
    }
    throw new Error("Failed to extract information from the provided text.");
  }
};