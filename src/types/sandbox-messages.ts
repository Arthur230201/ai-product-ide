/**
 * Sandbox Message Types
 * 
 * Type-safe message protocol between host and iframe sandbox.
 */

import { z } from 'zod';

// ==================== Host to Sandbox Messages ====================

export const HostToSandboxMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('INJECT'),
    script: z.string(),
  }),
  z.object({
    type: z.literal('SET_MODE'),
    mode: z.enum(['preview', 'edit']),
  }),
]);

export type HostToSandboxMessage = z.infer<typeof HostToSandboxMessageSchema>;

// ==================== Sandbox to Host Messages ====================

export const SandboxToHostMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PATCH'),
    patch: z.object({
      op: z.enum(['SET_TEXT', 'SET_ATTR', 'TOGGLE_CLASS']),
      selector: z.string(),
      value: z.string().optional(),
      name: z.string().optional(),
      className: z.string().optional(),
      enabled: z.boolean().optional(),
    }),
  }),
  z.object({
    type: z.literal('NAV'),
    to: z.string(),
  }),
  z.object({
    type: z.literal('EXPORT_PNG'),
    dataUrl: z.string(),
    width: z.number(),
    height: z.number(),
  }),
  z.object({
    type: z.literal('ERROR'),
    message: z.string(),
  }),
  z.object({
    type: z.literal('READY'),
  }),
]);

export type SandboxToHostMessage = z.infer<typeof SandboxToHostMessageSchema>;

// ==================== Validation Helpers ====================

export function validateHostToSandboxMessage(data: unknown): { valid: boolean; message?: HostToSandboxMessage; error?: string } {
  try {
    const message = HostToSandboxMessageSchema.parse(data);
    return { valid: true, message };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid message' };
  }
}

export function validateSandboxToHostMessage(data: unknown): { valid: boolean; message?: SandboxToHostMessage; error?: string } {
  try {
    const message = SandboxToHostMessageSchema.parse(data);
    return { valid: true, message };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid message' };
  }
}


