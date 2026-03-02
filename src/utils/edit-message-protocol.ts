/**
 * Edit Mode Message Protocol
 * 
 * Defines the communication protocol between iframe (sandbox) and host (React)
 * for text editing in edit mode.
 * 
 * All messages must be validated with Zod schemas.
 */

import { z } from 'zod';

/**
 * Message types sent from iframe to host
 */
export const IframeToHostMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('IFRAME_READY'),
    origin: z.string(),
  }),
  z.object({
    type: z.literal('TEXT_NODE_CLICKED'),
    selector: z.string(),
    text: z.string(),
    rect: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
  }),
  z.object({
    type: z.literal('APPLY_RESULT'),
    ok: z.boolean(),
    html: z.string().optional(),
    error: z.string().optional(),
  }),
]);

export type IframeToHostMessage = z.infer<typeof IframeToHostMessageSchema>;

/**
 * Message types sent from host to iframe
 */
export const HostToIframeMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('APPLY_TEXT_PATCH'),
    selector: z.string(),
    newText: z.string(),
  }),
  z.object({
    type: z.literal('CLEAR_EDIT_MODE'),
  }),
]);

export type HostToIframeMessage = z.infer<typeof HostToIframeMessageSchema>;

/**
 * Validate message from iframe
 */
export function validateIframeMessage(data: unknown): { valid: true; message: IframeToHostMessage } | { valid: false; error: string } {
  try {
    const message = IframeToHostMessageSchema.parse(data);
    return { valid: true, message };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid message format';
    return { valid: false, error: errorMessage };
  }
}

/**
 * Validate message from host
 */
export function validateHostMessage(data: unknown): { valid: true; message: HostToIframeMessage } | { valid: false; error: string } {
  try {
    const message = HostToIframeMessageSchema.parse(data);
    return { valid: true, message };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid message format';
    return { valid: false, error: errorMessage };
  }
}

/**
 * Check if origin is allowed (must be same origin or trusted)
 */
export function isAllowedOrigin(origin: string, expectedOrigin: string): boolean {
  // For MVP: only same origin allowed
  return origin === expectedOrigin;
}


