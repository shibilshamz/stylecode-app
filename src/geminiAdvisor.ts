export interface StyleProfile {
  skinTone: string;
  bodyShape: string;
  height: string;
  occasion: string;
}

export interface ColourSwatch {
  name: string;
  hex: string;
  pantone: string;
  realWorldRef: string;
}

export interface OutfitColour {
  name: string;
  hex: string;
  pantone: string;
}

export interface Outfit {
  name: string;
  occasion: string;
  colors: OutfitColour[];
  why: string;
}

export interface StyleResult {
  profileTitle: string;
  profileDesc: string;
  palette: ColourSwatch[];
  outfits: Outfit[];
  tips: string[];
  avoid: string[];
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function getStyleAdvice(profile: StyleProfile): Promise<StyleResult> {
  console.log("[StyleCode] Sending request to proxy…");

  const response = await fetch(`${API_URL}/api/style`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    let msg = `Proxy error ${response.status}`;
    try {
      const data = await response.json() as { error?: string };
      if (data.error) msg = data.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  const result = await response.json() as StyleResult;
  return result;
}
