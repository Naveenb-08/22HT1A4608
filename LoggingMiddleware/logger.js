import axios from "axios";

const BASE_URL = "http://20.244.56.144/evaluation-service/logs";

export async function logEvent(stack, level, pkg, message, token) {
  try {
    await axios.post(
      BASE_URL,
      { stack, level, package: pkg, message },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("Log failed:", err.message);
  }
}
