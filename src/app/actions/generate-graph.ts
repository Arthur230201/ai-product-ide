'use server';

import { createServerAction } from 'zsa';
import { z } from 'zod';

const GenerateGraphInputSchema = z.object({
  prompt: z.string(),
  mediaBase64: z.string().optional(),
  mediaType: z.enum(['image', 'video']).optional(),
  attachmentContent: z.string().optional(),
  attachmentType: z.enum(['media', 'text']).optional(),
  mimeType: z.string().optional(),
});

export const generateGraph = createServerAction()
  .input(GenerateGraphInputSchema)
  .handler(async ({ input }) => {
    // TODO: 实现图生成逻辑
    // 这是一个占位符实现，需要根据实际需求完善
    return {
      data: {
        nodes: [],
        edges: [],
      },
    };
  });
