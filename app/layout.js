import './globals.css'

export const metadata = {
  title: 'Digital Memory Jar',
  description: 'Leave a little piece of your heart among the stars.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
