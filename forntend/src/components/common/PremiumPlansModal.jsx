import React from 'react';
import { Crown, Sparkles, CheckCircle2, X } from 'lucide-react';

const plans = [
  {
    name: 'Starter Plus',
    price: '$4.99/mo',
    subtitle: 'Perfect for focused learners',
    features: ['120 AI credits / month', 'Priority PDF processing', 'Advanced quiz generation'],
    accent: 'from-amber-500 to-orange-500',
  },
  {
    name: 'Premium Pro',
    price: '$12.99/mo',
    subtitle: 'Best value for serious study',
    features: ['Unlimited AI credits', 'Roadmaps, flashcards, and deep notes', 'Fastest generation + premium support'],
    accent: 'from-blue-600 to-cyan-500',
    featured: true,
  },
  {
    name: 'Team Elite',
    price: '$29.99/mo',
    subtitle: 'For study circles and mentors',
    features: ['Everything in Premium Pro', 'Up to 5 collaborative members', 'Shared dashboards and export reports'],
    accent: 'from-emerald-500 to-teal-500',
  },
];

const PremiumPlansModal = ({ isOpen, onClose, title = 'Upgrade to Premium' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl rounded-[2.2rem] overflow-hidden border border-white/10 shadow-2xl shadow-blue-900/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Close premium plans"
        >
          <X size={18} />
        </button>

        <div className="px-8 pt-10 pb-6 md:px-12 md:pt-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 text-amber-200 px-4 py-1.5 text-xs font-bold uppercase tracking-wide border border-amber-300/30">
            <Crown size={14} /> Premium Access
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mt-4 leading-tight">
            {title}
          </h2>
          <p className="mt-3 text-slate-200 max-w-2xl text-sm md:text-base">
            You have reached your free credit limit. Pick a plan to continue with unlimited learning tools, deeper AI analysis,
            and faster results across your study workflow.
          </p>
        </div>

        <div className="px-8 pb-8 md:px-12 md:pb-12 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-6 border ${plan.featured ? 'border-blue-300/40 bg-white/10 scale-[1.01]' : 'border-white/15 bg-white/5'} backdrop-blur`}
            >
              {plan.featured && (
                <span className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/25 text-blue-100 border border-blue-300/30 uppercase tracking-wide">
                  <Sparkles size={12} /> Most Popular
                </span>
              )}

              <div className={`h-1.5 rounded-full bg-gradient-to-r ${plan.accent} mb-5`} />
              <h3 className="text-2xl font-extrabold">{plan.name}</h3>
              <p className="text-3xl font-black mt-2">{plan.price}</p>
              <p className="text-slate-300 text-sm mt-1">{plan.subtitle}</p>

              <ul className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-100">
                    <CheckCircle2 size={16} className="text-emerald-300 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={onClose}
                className={`mt-7 w-full py-3 rounded-2xl font-black transition-all ${plan.featured ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-900/30' : 'bg-white/15 hover:bg-white/25 text-white'}`}
              >
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PremiumPlansModal;