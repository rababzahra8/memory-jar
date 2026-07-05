import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ ok: true, name: 'Digital Memory Jar' })
}

export async function POST() {
  return NextResponse.json({ ok: true })
}
