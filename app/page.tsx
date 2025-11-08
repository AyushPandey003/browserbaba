import { Brain, Zap, Shield, Layers, Sparkles, Search, Tag } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#101922] to-[#1a232c]">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#2b8cee] to-[#1e6bb8]">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-white text-xl font-bold">Synapse</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-6 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-6 py-2 rounded-lg bg-[#2b8cee] hover:bg-[#3a9cff] text-white text-sm font-semibold transition-all duration-200 shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2b8cee] to-[#1e6bb8] shadow-2xl">
              <Brain className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black text-white mb-6">
            Your Digital <br/>
            <span className="bg-gradient-to-r from-[#2b8cee] to-[#5ab0ff] bg-clip-text text-transparent">
              Second Brain
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Capture, organize, and visualize everything from across the web. 
            Never lose a valuable article, video, or idea again.
          </p>
          
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-xl bg-[#2b8cee] hover:bg-[#3a9cff] text-white font-semibold transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 transform"
            >
              Open Dashboard
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-xl border-2 border-gray-700 hover:border-[#2b8cee] text-gray-300 hover:text-white font-semibold transition-all duration-200"
            >
              Sign In
            </Link>
          </div>

          {/* Feature Pills */}
          <div className="flex items-center justify-center gap-3 mt-12 flex-wrap">
            <div className="px-4 py-2 rounded-full bg-[#1a232c] border border-gray-800 text-gray-300 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2b8cee]" />
              AI-Powered Search
            </div>
            <div className="px-4 py-2 rounded-full bg-[#1a232c] border border-gray-800 text-gray-300 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#2b8cee]" />
              100% Private
            </div>
            <div className="px-4 py-2 rounded-full bg-[#1a232c] border border-gray-800 text-gray-300 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#2b8cee]" />
              Lightning Fast
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-gray-800">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Everything You Need</h2>
          <p className="text-gray-400 text-lg">Powerful features to organize your digital life</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Zap className="w-10 h-10 text-[#2b8cee]" />}
            title="Instant Capture"
            description="Save articles, videos, products, and notes with one click using our browser extension."
          />
          <FeatureCard
            icon={<Search className="w-10 h-10 text-[#2b8cee]" />}
            title="AI-Powered Search"
            description="Find anything with natural language. Search like 'articles about AI from last month'."
          />
          <FeatureCard
            icon={<Tag className="w-10 h-10 text-[#2b8cee]" />}
            title="Smart Organization"
            description="Automatically categorize and tag your content with intelligent metadata extraction."
          />
          <FeatureCard
            icon={<Layers className="w-10 h-10 text-[#2b8cee]" />}
            title="Beautiful Collections"
            description="Create collections and organize your memories in a stunning masonry grid layout."
          />
          <FeatureCard
            icon={<Shield className="w-10 h-10 text-[#2b8cee]" />}
            title="Secure & Private"
            description="Your data is encrypted and stored securely in your own Neon Postgres database."
          />
          <FeatureCard
            icon={<Sparkles className="w-10 h-10 text-[#2b8cee]" />}
            title="RAG Integration"
            description="Conversational AI with context-aware responses powered by Gemini embeddings."
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-gradient-to-br from-[#2b8cee] to-[#1e6bb8] rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to Build Your Second Brain?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users organizing their digital knowledge with Synapse.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/login"
              className="px-8 py-4 rounded-xl bg-white text-[#2b8cee] font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:scale-105 transform"
            >
              Get Started Free
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-xl border-2 border-white text-white font-semibold hover:bg-white/10 transition-all duration-200"
            >
              View Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#2b8cee] to-[#1e6bb8]">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold">Synapse</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 Synapse. Your intelligent second brain.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-[#1a232c] rounded-2xl p-6 border border-gray-800 hover:border-[#2b8cee] transition-all duration-300 hover:shadow-xl hover:shadow-[#2b8cee]/10">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
