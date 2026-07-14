import { Link } from 'react-router-dom';
import { Wrench, Search, Calendar, Star, Shield, Clock, ArrowRight, CheckCircle, Users, Briefcase, TrendingUp } from 'lucide-react';

const categories = [
  { name: 'Plumbing', icon: '🔧', count: '120+ workers' },
  { name: 'Electrical', icon: '⚡', count: '85+ workers' },
  { name: 'Carpentry', icon: '🪚', count: '95+ workers' },
  { name: 'Painting', icon: '🎨', count: '110+ workers' },
  { name: 'Cleaning', icon: '🧹', count: '200+ workers' },
  { name: 'Gardening', icon: '🌿', count: '75+ workers' },
  { name: 'HVAC', icon: '❄️', count: '60+ workers' },
  { name: 'IT Support', icon: '💻', count: '90+ workers' },
];

const steps = [
  { icon: Search, title: 'Find a Professional', desc: 'Search our vetted workers by skill, location, and availability.' },
  { icon: Calendar, title: 'Book Instantly', desc: 'Schedule at a time that works for you with real-time availability.' },
  { icon: CheckCircle, title: 'Get It Done', desc: 'Your worker arrives on time and completes the job to your satisfaction.' },
];

const testimonials = [
  { name: 'Sarah M.', role: 'Homeowner', rating: 5, text: 'Found an excellent plumber within minutes. Professional and affordable!' },
  { name: 'David K.', role: 'Business Owner', rating: 5, text: 'We use SkillHire for all our office maintenance. Reliable every time.' },
  { name: 'Emma L.', role: 'Apartment Renter', rating: 5, text: 'The booking process is so simple. Great workers, great prices.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wrench size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">SkillHire</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary">Sign In</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-sm text-blue-300 mb-6">
              <TrendingUp size={14} />
              <span>Trusted by 10,000+ customers</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Hire Skilled Workers<br />
              <span className="text-blue-400">On Demand</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 max-w-xl">
              Connect with verified, experienced professionals for any home or business service. Fast, reliable, and transparent pricing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="btn-primary py-4 px-8 text-base rounded-xl">
                Hire a Worker <ArrowRight size={18} />
              </Link>
              <Link to="/register?role=worker" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white rounded-xl font-medium text-base hover:bg-white/20 transition-colors">
                Offer Your Services
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-lg">
            {[
              { value: '5,000+', label: 'Verified Workers' },
              { value: '98%', label: 'Satisfaction Rate' },
              { value: '50k+', label: 'Jobs Completed' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Browse by Category</h2>
            <p className="text-gray-500 max-w-md mx-auto">Find experts across all home services and trades</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map(({ name, icon, count }) => (
              <Link key={name} to="/register"
                className="bg-white rounded-xl p-5 border border-gray-100 hover:border-blue-200 hover:shadow-card-hover transition-all text-center group">
                <div className="text-3xl mb-3">{icon}</div>
                <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{name}</div>
                <div className="text-xs text-gray-400 mt-1">{count}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500">Get started in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <Icon size={28} className="text-white" />
                </div>
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Step {i + 1}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why SkillHire */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose SkillHire?</h2>
              <p className="text-gray-500 mb-8">We connect you with the most reliable professionals in your area.</p>
              {[
                { icon: Shield, title: 'Verified Workers', desc: 'All professionals are background-checked and verified before joining.' },
                { icon: Star, title: 'Rated & Reviewed', desc: 'Read genuine reviews from real customers before booking.' },
                { icon: Clock, title: 'On-time Guarantee', desc: 'Workers are committed to punctuality and professional standards.' },
                { icon: Users, title: 'Wide Coverage', desc: 'Thousands of skilled workers across all major cities.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 mb-5">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm mb-0.5">{title}</div>
                    <div className="text-sm text-gray-500">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white">
              <Briefcase size={40} className="mb-4 opacity-80" />
              <h3 className="text-2xl font-bold mb-3">Are You a Skilled Worker?</h3>
              <p className="text-blue-100 text-sm mb-6">Join thousands of professionals earning more with SkillHire. Set your own rates and schedule.</p>
              <ul className="space-y-2 mb-8">
                {['Create a free profile', 'Receive booking requests', 'Earn on your terms', 'Build your reputation'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-blue-100">
                    <CheckCircle size={14} className="text-blue-300 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors">
                Join as Worker <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">What Our Customers Say</h2>
            <p className="text-gray-500">Real reviews from real people</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, rating, text }) => (
              <div key={name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mb-4 italic">"{text}"</p>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{name}</div>
                  <div className="text-xs text-gray-400">{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-blue-100 mb-8">Join SkillHire today — free for clients, free to register as a worker.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-500/30 border border-blue-400/40 text-white rounded-xl font-semibold hover:bg-blue-500/50 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wrench size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">SkillHire</span>
          </div>
          <p className="text-xs">&copy; {new Date().getFullYear()} SkillHire. All rights reserved.</p>
          <div className="flex gap-5 text-xs">
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Terms</span>
            <span className="hover:text-white cursor-pointer">Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
