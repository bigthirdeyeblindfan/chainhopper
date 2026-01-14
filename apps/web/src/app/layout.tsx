import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ChainHopper - Multi-Chain Trading',
  description: 'Free to trade. Pay only when you profit.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-gray-200 dark:border-gray-800">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <span className="text-xl font-bold">ChainHopper</span>
                <div className="hidden md:flex items-center gap-6">
                  <a href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    Dashboard
                  </a>
                  <a href="/trade" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    Trade
                  </a>
                  <a href="/portfolio" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    Portfolio
                  </a>
                  <a href="/analytics" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    Analytics
                  </a>
                  <a href="/settings" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    Settings
                  </a>
                </div>
              </div>
              <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
                Connect Wallet
              </button>
            </nav>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-gray-200 dark:border-gray-800 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
              ChainHopper - Free to trade. Pay only when you profit.
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
