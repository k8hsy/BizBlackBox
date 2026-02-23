import './globals.css'

export const metadata = {
  title: 'BBB Portal',
  description: 'BBB Portal Application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
