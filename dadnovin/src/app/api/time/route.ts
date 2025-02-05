import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    serverTime: new Date().toString(),
    serverTimeUTC: new Date().toUTCString(),
    envTZ: process.env.TZ,
    // Additional check using Linux command
    systemTimezone: require('child_process')
      .execSync('cat /etc/timezone')
      .toString()
      .trim()
  });
} 