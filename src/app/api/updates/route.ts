import { NextResponse } from 'next/server'

export interface PilotUpdate {
  id: string
  date: string
  title: string
  description: string
  impact: 'high' | 'fix'
}

export const revalidate = 300 // cache for 5 minutes

export async function GET() {
  try {
    const res = await fetch('https://ray-research-info.vercel.app/updates', {
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      return NextResponse.json({ updates: [] })
    }

    const html = await res.text()

    // Parse update blocks — each is a <div class="glass-panel ... border-l-4 ...">
    const updates: PilotUpdate[] = []
    const blockRegex = /<div class="glass-panel p-5 rounded-sm border-l-4 border-(clay|forest-green)">([\s\S]*?)<\/div>\s*(?=<div class="glass-panel|<\/section>|<nav)/g

    let match
    while ((match = blockRegex.exec(html)) !== null) {
      const borderColor = match[1] // 'clay' = high impact, 'forest-green' = fix
      const block = match[2]

      const isHigh = borderColor === 'clay' || block.includes('High Impact')

      // Extract date
      const dateMatch = block.match(/<p class="label-sm text-warm-grey[^"]*">\s*([^<]+)<\/p>/)
      const date = dateMatch ? dateMatch[1].trim() : ''

      // Extract title
      const titleMatch = block.match(/<p class="font-bold mb-2">\s*([^<]+)<\/p>/)
      const title = titleMatch ? titleMatch[1].trim() : ''

      // Extract description
      const descMatch = block.match(/<p class="body-text text-sm">\s*([\s\S]*?)\s*<\/p>/)
      const description = descMatch ? descMatch[1].trim() : ''

      if (title) {
        // Create a stable ID from date + title
        const id = `${date}-${title}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
        updates.push({
          id,
          date,
          title,
          description,
          impact: isHigh ? 'high' : 'fix',
        })
      }
    }

    return NextResponse.json({ updates })
  } catch {
    return NextResponse.json({ updates: [] })
  }
}
