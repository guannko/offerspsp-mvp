import './globals.css'

export const metadata = {
  title: 'OffersPSP - B2B Casino Payment Solutions',
  description: 'Professional B2B platform connecting online casinos with payment solution providers',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}