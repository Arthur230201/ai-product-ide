// Route segment config for server actions
// Set maximum execution duration to 10 minutes (600 seconds) for complex LLM tasks
// Increased from 5 minutes to handle large image processing and UI generation
export const maxDuration = 600;

// This is not a page route, only a config file for server actions
// Return 404 for any HTTP requests to /actions
export async function GET() {
  return new Response('Not Found', { status: 404 });
}

export async function POST() {
  return new Response('Not Found', { status: 404 });
}













