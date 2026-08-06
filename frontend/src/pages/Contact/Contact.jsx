import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import GlassCard from '../../components/ui/GlassCard';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'Clinical Inquiry', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-4 py-1.5 rounded-full uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> 24/7 Clinical Support
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Get in Touch with Our <span className="text-gradient">Dermatology Panel</span>
        </h1>
        <p className="text-gray-500 text-sm">
          Have questions about your AI skin diagnostic report, partnership options, or medical API integration?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Sidebar */}
        <GlassCard className="p-8 space-y-8 flex flex-col justify-between border border-white/50">
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/60 pb-3">
              Corporate Headquarters
            </h3>

            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-gray-900 dark:text-white">AI Skincare Labs Inc.</strong>
                  500 Medical Center Parkway, Suite 1200<br />
                  Palo Alto, CA 94304
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-teal-500 flex-shrink-0" />
                <span>support@skinintelligence.ai</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-teal-500 flex-shrink-0" />
                <span>+1 (800) 555-SKIN</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/50 text-xs text-teal-800 dark:text-teal-300">
            <strong className="block font-bold">Average Response Time</strong>
            Under 15 minutes for clinical accounts.
          </div>
        </GlassCard>

        {/* Contact Form */}
        <GlassCard className="lg:col-span-2 p-8 sm:p-10 space-y-6">
          {sent ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Message Dispatched</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Thank you for reaching out. A clinical representative has received your inquiry and will follow up shortly.
              </p>
              <button
                onClick={() => setSent(false)}
                className="btn-glass px-6 py-2.5 rounded-full text-xs font-semibold mt-4"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/60 pb-3">
                Send a Message
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full glass-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                  Inquiry Topic
                </label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full glass-input"
                >
                  <option value="Clinical Inquiry">Clinical Assessment Support</option>
                  <option value="Dermatologist Onboarding">Dermatologist / Consultant Onboarding</option>
                  <option value="API Partnership">Enterprise SaaS API Licensing</option>
                  <option value="General Support">General Platform Support</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                  Message Details
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe your inquiry..."
                  className="w-full glass-input resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gradient-primary w-full py-3.5 rounded-full font-semibold shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Message</span> <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
