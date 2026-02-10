import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const EMAIL = process.env.OFFICIAL_EMAIL;

// ---------- Utility Functions ----------
const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
};

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const lcm = (a, b) => (a * b) / gcd(a, b);

// ---------- GET /health ----------
app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL
  });
});

// ---------- POST /bfhl ----------
app.post("/bfhl", async (req, res) => {
  try {
    const body = req.body;

    // 🔒 ADD THIS GUARD (VERY IMPORTANT)
    if (!body || typeof body !== "object") {
      return res.status(400).json({
        is_success: false,
        message: "Request body is required"
      });
    }

    const keys = Object.keys(body);


    // exactly one key required
    if (keys.length !== 1) {
      return res.status(400).json({
        is_success: false,
        message: "Exactly one key is required"
      });
    }

    const key = keys[0];
    let data;

    switch (key) {
      case "fibonacci": {
        const n = body.fibonacci;
        if (!Number.isInteger(n) || n < 0)
          throw new Error("Invalid fibonacci input");

        const fib = [0, 1];
        for (let i = 2; i < n; i++) {
          fib.push(fib[i - 1] + fib[i - 2]);
        }
        data = fib.slice(0, n);
        break;
      }

      case "prime": {
        if (!Array.isArray(body.prime))
          throw new Error("Prime expects an array");

        data = body.prime.filter(
          (x) => Number.isInteger(x) && isPrime(x)
        );
        break;
      }

      case "lcm": {
        if (!Array.isArray(body.lcm) || body.lcm.length === 0)
          throw new Error("LCM expects a non-empty array");

        data = body.lcm.reduce((acc, val) => lcm(acc, val));
        break;
      }

      case "hcf": {
        if (!Array.isArray(body.hcf) || body.hcf.length === 0)
          throw new Error("HCF expects a non-empty array");

        data = body.hcf.reduce((acc, val) => gcd(acc, val));
        break;
      }

      case "AI": {
        if (typeof body.AI !== "string")
          throw new Error("AI expects a string");

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [{ parts: [{ text: body.AI }] }]
          }
        );

        data =
          response.data.candidates?.[0]?.content?.parts?.[0]?.text
            ?.split(" ")[0] || "Unknown";
        break;
      }

      default:
        return res.status(400).json({
          is_success: false,
          message: "Invalid key"
        });
    }

    res.status(200).json({
      is_success: true,
      official_email: EMAIL,
      data
    });
  } catch (err) {
    res.status(400).json({
      is_success: false,
      message: err.message
    });
  }
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
