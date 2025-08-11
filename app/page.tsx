import Chatbot from '@/components/Chatbot';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Dezy Clinic
          </h1>
          <p className="text-gray-600">
            Excellence in Plastic Surgery • Book Your Consultation Today
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Chatbot />
        </div>
        
        <div className="text-center mt-8">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            View Admin Dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}