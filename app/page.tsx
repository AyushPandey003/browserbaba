import { Brain, Zap, Shield, Layers, Sparkles, Search, Tag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 bg-background/80 backdrop-blur-lg z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-foreground text-2xl font-bold tracking-tighter">Synapse</h1>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="#features" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
              <Link href="#pricing" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/docs" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-6 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-all duration-200 shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-6 tracking-tighter">
              The Second Brain for Your Digital Life
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Synapse is an open-source platform to capture, organize, and retrieve everything you find important on the web. Your personal knowledge base, supercharged with AI.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                Start Building <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="https://github.com/your-repo/synapse" // Replace with your repo link
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-border hover:border-primary text-muted-foreground hover:text-foreground font-semibold transition-all duration-200"
              >
                Star on GitHub
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gray-900 via-gray-900 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent" />
      </header>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">A Feature Set That Feels Like a Superpower</h2>
          <p className="text-muted-foreground text-lg">Everything you need to conquer information overload.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-blue-400" />}
            title="One-Click Capture"
            description="A powerful browser extension to save anything from anywhere. Articles, videos, products, notes, and more."
          />
          <FeatureCard
            icon={<Search className="w-8 h-8 text-blue-400" />}
            title="Semantic Search"
            description="Go beyond keywords. Find information by meaning and context. It’s like asking a question and getting the perfect answer."
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8 text-blue-400" />}
            title="AI-Powered Organization"
            description="Automatic tagging, summarization, and metadata extraction. Your knowledge base organizes itself."
          />
          <FeatureCard
            icon={<Layers className="w-8 h-8 text-blue-400" />}
            title="Visual Knowledge Graph"
            description="Connect your ideas and discover new relationships in a beautiful, interactive graph view."
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-blue-400" />}
            title="Private & Secure"
            description="You own your data. Host it yourself or use our secure cloud. End-to-end encryption is coming soon."
          />
          <FeatureCard
            icon={<Tag className="w-8 h-8 text-blue-400" />}
            title="Flexible Organization"
            description="Use tags, collections, and nested structures to organize your way. Your brain, your rules."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Stop Losing Knowledge. Start Building It.</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Synapse is free and open-source. Start your journey to a more organized digital life today.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-white text-blue-600 font-bold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:scale-105 transform"
          >
            Get Started for Free <ArrowRight />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-400 hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
                <li><Link href="/docs" className="text-gray-400 hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Community</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">GitHub</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Discord</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Twitter</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-800 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-foreground font-semibold">Synapse</span>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Synapse. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:shadow-primary/10 transform hover:-translate-y-1">
      <div className="mb-4 bg-muted w-14 h-14 flex items-center justify-center rounded-lg">{icon}</div>
      <h3 className="text-xl font-semibold text-card-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
