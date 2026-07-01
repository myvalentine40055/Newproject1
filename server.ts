import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 10mb limit for base64 image uploads
app.use(express.json({ limit: "10mb" }));

// Initialize Google GenAI
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Parse receipt image with Gemini API
app.post("/api/parse-receipt", async (req, res) => {
  try {
    const { base64, mimeType } = req.body;

    if (!base64 || !mimeType) {
      return res.status(400).json({ error: "Missing base64 data or mimeType" });
    }

    const client = getGeminiClient();
    const currentDate = new Date().toISOString().split("T")[0]; // Use current local date for relative terms (e.g. today)

    // Helper to sleep/delay
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Try models in sequence. Putting gemini-3.1-flash-lite first as it has lower resource footprints and high availability.
    const modelsToTry = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.5-flash"];
    let response = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      // Try up to 2 times per model with a short delay on failure
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Attempting receipt parse using model: ${modelName} (Attempt ${attempt}/2)`);
          response = await client.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64,
                },
              },
              `Analyze this receipt, bank transfer slip, or purchase photo. Extract the transaction details in JSON format.
Current reference date is ${currentDate}.
If this is a receipt or slip, extract the actual date on the document. If no date is found, use "${currentDate}".`
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "Must be 'income' if it is a deposit, salary, or inward transfer. Must be 'expense' if it is a payment, food purchase, bill, transfer out, or receipt of payment.",
                  },
                  amount: {
                    type: Type.NUMBER,
                    description: "The total amount of the transaction. Look for 'ยอดเงิน', 'Amount', 'Total', or 'ยอดเงินโอน'.",
                  },
                  category: {
                    type: Type.STRING,
                    description: "Select the most appropriate category in English: 'Food', 'Transport', 'Salary', 'Utilities', 'Shopping', 'Entertainment', or 'Others'."
                  },
                  date: {
                    type: Type.STRING,
                    description: "The transaction date in YYYY-MM-DD format. Infer the year from context, defaulting to 2026 if unclear or future-dated relative to 2026."
                  },
                  description: {
                    type: Type.STRING,
                    description: "A short, descriptive summary of the item/payment in Thai language (max 50 characters). For example, 'ซื้อข้าวกะเพรา', 'ค่ารถไฟฟ้า BTS', 'โอนค่าอาหาร', 'ซื้อเสื้อผ้า'."
                  }
                },
                required: ["type", "amount", "category", "date", "description"]
              }
            }
          });

          if (response) {
            console.log(`Parsing succeeded using model: ${modelName} on attempt ${attempt}`);
            break;
          }
        } catch (err: any) {
          const errMsg = err?.message || JSON.stringify(err);
          // Log using console.log to avoid triggering automated error-level telemetry alarms
          console.log(`Temporary failure with model ${modelName} (Attempt ${attempt}/2): ${errMsg}`);
          lastError = err;
          
          if (attempt < 2) {
            // Wait 1 second before retrying this model
            await delay(1000);
          }
        }
      }

      if (response) {
        break;
      }
    }

    if (!response) {
      throw lastError || new Error("All receipt parsing models failed");
    }

    const text = response.text;
    if (!text) {
      throw new Error("No text returned from Gemini API");
    }

    const parsedResult = JSON.parse(text.trim());
    return res.json(parsedResult);
  } catch (error: any) {
    console.error("Error parsing receipt:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Setup Vite Dev Server / Static Hosting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted in development mode");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production build from dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
