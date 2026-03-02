/**
 * Protocol Extractor
 * 
 * Extracts tagged blocks from AI responses without JSON repairing.
 * This ensures deterministic parsing and prevents malformed JSON issues.
 */

/**
 * Extracts a tagged block from text.
 * 
 * @param text The full text response from AI
 * @param tag The tag name (e.g., 'AI_JSON')
 * @returns The content between tags, trimmed, or null if not found
 * 
 * Example:
 *   extractTaggedBlock('Some text <AI_JSON>{"key":"value"}</AI_JSON> more text', 'AI_JSON')
 *   => '{"key":"value"}'
 */
export function extractTaggedBlock(text: string, tag: string): string | null {
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;
  
  const openIndex = text.indexOf(openTag);
  if (openIndex === -1) {
    return null;
  }
  
  const closeIndex = text.indexOf(closeTag, openIndex + openTag.length);
  if (closeIndex === -1) {
    return null;
  }
  
  const start = openIndex + openTag.length;
  const content = text.substring(start, closeIndex).trim();
  
  return content;
}


