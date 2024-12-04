import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Initialize Redis
const redis = Redis.fromEnv();

export async function GET() {
  try {
    // Set a value in Redis
    await redis.set("test-key", "Hello from Upstash Redis!");

    // Get the value from Redis
    const result = await redis.get("test-key");

    // Return the result in the response
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Redis operation failed:", error);
    return NextResponse.json(
      { error: "Failed to perform Redis operation" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();

    // Set the provided key-value pair in Redis
    await redis.set(key, value);

    // Return a success message
    return NextResponse.json({ message: "Value set successfully" });
  } catch (error) {
    console.error("Redis operation failed:", error);
    return NextResponse.json(
      { error: "Failed to perform Redis operation" },
      { status: 500 },
    );
  }
}
