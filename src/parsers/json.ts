import { ResponseParser } from "../core/types";

/**
 * Create a parser that extracts JSON from a text response and parses it
 */
export function jsonParser<T>(): ResponseParser<T> {
  return (rawResponse: string): T => {
    try {
      // Try to parse the entire response as JSON
      return JSON.parse(rawResponse);
    } catch (e) {
      // If that fails, try to extract JSON from the response
      const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/) || 
                        rawResponse.match(/```\n([\s\S]*?)\n```/) ||
                        rawResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (e) {
          throw new Error(`Failed to parse JSON from response: ${rawResponse}`);
        }
      }
      
      throw new Error(`No valid JSON found in response: ${rawResponse}`);
    }
  };
}

/**
 * Create a parser that extracts a specific field from a JSON response
 */
export function jsonFieldParser<T>(field: string): ResponseParser<T> {
  const parser = jsonParser<any>();
  
  return (rawResponse: string): T => {
    const parsedJson = parser(rawResponse);
    
    if (parsedJson && parsedJson[field] !== undefined) {
      return parsedJson[field];
    }
    
    throw new Error(`Field '${field}' not found in response JSON`);
  };
}
