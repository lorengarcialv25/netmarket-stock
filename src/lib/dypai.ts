import { createClient } from "@dypai-ai/client-sdk";

// JWT handles all auth — only URL needed
export const dypai = createClient(process.env.NEXT_PUBLIC_DYPAI_URL!);
