const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function moderateImage(imageUrl: string): Promise<{
  approved: boolean;
  reason?: string;
}> {
  if (!OPENAI_API_KEY) {
    console.warn("OpenAI API key not set, skipping moderation");
    return { approved: true };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: [{ type: "image_url", image_url: { url: imageUrl } }],
      }),
    });

    if (!response.ok) {
      console.error("Moderation API error:", response.status);
      return { approved: true };
    }

    const data = await response.json();
    const result = data.results?.[0];

    if (result?.flagged) {
      const categories = result.categories;
      const flaggedCategories = Object.entries(categories)
        .filter(([, v]) => v === true)
        .map(([k]) => k);
      return {
        approved: false,
        reason: `Content flagged: ${flaggedCategories.join(", ")}`,
      };
    }

    return { approved: true };
  } catch (error) {
    console.error("Moderation error:", error);
    return { approved: true };
  }
}
