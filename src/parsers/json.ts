import { ResponseParser } from "../core/types";

/**
 * Create a parser that extracts JSON from a text response and parses it
 */
export function jsonParser<T>(): ResponseParser<T> {
  return (rawResponse: string): T => {
    // First, try to parse the entire response as JSON
    try {
      return JSON.parse(rawResponse.trim());
    } catch (e) {
      // If that fails, try to extract JSON from the response
      
      // Try various markdown code block patterns
      const codeBlockPatterns = [
        /```json\s*\n?([\s\S]*?)\n?```/i,  // ```json with optional newlines
        /```JSON\s*\n?([\s\S]*?)\n?```/,    // ```JSON (uppercase)
        /```\s*\n?([\s\S]*?)\n?```/,        // ``` without language tag
      ];
      
      for (const pattern of codeBlockPatterns) {
        const match = rawResponse.match(pattern);
        if (match && match[1]) {
          try {
            return JSON.parse(match[1].trim());
          } catch (parseError) {
            // Continue to next pattern
          }
        }
      }
      
      // Try to find any JSON object or array in the response
      // Use a simpler approach: find the first { or [ and extract to the matching } or ]
      let jsonStart = rawResponse.indexOf('{');
      let jsonArrayStart = rawResponse.indexOf('[');
      
      // Try object first if it appears before array (or array doesn't exist)
      if (jsonStart !== -1 && (jsonArrayStart === -1 || jsonStart < jsonArrayStart)) {
        // Count braces to find the matching closing brace
        let braceCount = 0;
        let inString = false;
        let escaped = false;
        let jsonEnd = jsonStart;
        
        for (let i = jsonStart; i < rawResponse.length; i++) {
          const char = rawResponse[i];
          
          if (!escaped && char === '"') {
            inString = !inString;
          } else if (!escaped && !inString) {
            if (char === '{') braceCount++;
            else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                jsonEnd = i;
                break;
              }
            }
          }
          
          escaped = !escaped && char === '\\';
        }
        
        if (braceCount === 0 && jsonEnd > jsonStart) {
          const jsonStr = rawResponse.substring(jsonStart, jsonEnd + 1);
          try {
            return JSON.parse(jsonStr);
          } catch (parseError) {
            // Continue to array check
          }
        }
      }
      
      // Try array if object didn't work
      if (jsonArrayStart !== -1) {
        let bracketCount = 0;
        let inString = false;
        let escaped = false;
        let jsonEnd = jsonArrayStart;
        
        for (let i = jsonArrayStart; i < rawResponse.length; i++) {
          const char = rawResponse[i];
          
          if (!escaped && char === '"') {
            inString = !inString;
          } else if (!escaped && !inString) {
            if (char === '[') bracketCount++;
            else if (char === ']') {
              bracketCount--;
              if (bracketCount === 0) {
                jsonEnd = i;
                break;
              }
            }
          }
          
          escaped = !escaped && char === '\\';
        }
        
        if (bracketCount === 0 && jsonEnd > jsonArrayStart) {
          const jsonStr = rawResponse.substring(jsonArrayStart, jsonEnd + 1);
          try {
            return JSON.parse(jsonStr);
          } catch (parseError) {
            // Fall through to error
          }
        }
      }
      
      // If we still can't parse, provide a cleaner error message
      // Extract a preview of the response for the error, removing markdown artifacts
      const preview = rawResponse
        .replace(/```json\s*/gi, '')
        .replace(/```/g, '')
        .trim()
        .substring(0, 100);
      
      throw new Error(`Failed to parse JSON from response. Response preview: ${preview}${rawResponse.length > 100 ? '...' : ''}`);
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
