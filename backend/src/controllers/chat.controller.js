import { generateStreamToken } from "../lib/stream.js";

export async function getStreamtoken(req, res) {
  try {
    const token = generateStreamToken(req.user.id);
    return res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamtoken", error.message);
    return res.status(500).json({
      message: "Internal server error while getting Stream token",
    });
  }
}
