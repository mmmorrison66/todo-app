import './globals.css'

export const metadata = {
  title: 'Tasks',
  description: 'A beautifully simple to-do app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
