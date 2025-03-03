import { ResponseParser } from "../core/types";

/**
 * Create a parser that extracts structured data based on regular expressions
 */
export function regexParser<T>(patterns: Record<keyof T, RegExp>): ResponseParser<T> {
  return (rawResponse: string): T => {
    const result = {} as T;
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const regexPattern = pattern as RegExp;
      const match = rawResponse.match(regexPattern);
      
      if (match && match[1]) {
        (result as any)[key] = match[1].trim();
      } else {
        throw new Error(`Failed to extract ${String(key)} using pattern ${pattern}`);
      }
    }
    
    return result;
  };
}

/**
 * Create a parser that extracts labeled fields from a text response
 * Example format: "Field: Value"
 */
export function labeledFieldsParser<T>(): ResponseParser<Partial<T>> {
  return (rawResponse: string): Partial<T> => {
    const result = {} as Partial<T>;
    const lines = rawResponse.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      
      if (match) {
        const [_, key, value] = match;
        (result as any)[key.trim()] = value.trim();
      }
    }
    
    return result;
  };
}

/**
 * Simple parser that returns the raw text
 */
export function textParser(): ResponseParser<string> {
  return (rawResponse: string): string => rawResponse.trim();
}
