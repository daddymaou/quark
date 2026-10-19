// app/(marketing)/layout.tsx
import { Nav } from '@/components/marketing/Nav'  
import { Footer } from '@/components/ui/Footer'
import { CommandPalette } from '@/components/ui/CommandPalette'

export const metadata = {
  title: 'Quark — Code Editor',
  description: 'Explain it to the duck. Ship it to the web.',
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
      <CommandPalette />
    </>
  )
}