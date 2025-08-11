import Dashboard from '@/components/Dashboard';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            ← Back to Chatbot
          </Link>
        </div>
        <Dashboard />
      </div>
    </main>
  );
}