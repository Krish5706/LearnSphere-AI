import React, { useMemo, useState } from 'react';
import { Crown, Sparkles, CheckCircle2, X, ReceiptText, CalendarClock, Mail, WalletCards } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const plans = [
  {
    key: 'starter_plus',
    name: 'Starter Plus',
    price: '$4.99/mo',
    subtitle: 'Perfect for focused learners',
    creditsAdded: 120,
    features: ['+120 AI credits', 'Priority PDF processing', 'Advanced quiz generation'],
    accent: 'from-amber-500 to-orange-500',
  },
  {
    key: 'premium_pro',
    name: 'Premium Pro',
    price: '$12.99/mo',
    subtitle: 'Best value for serious study',
    creditsAdded: 500,
    features: ['+500 AI credits', 'Roadmaps, flashcards, and deep notes', 'Fastest generation + premium support'],
    accent: 'from-blue-600 to-cyan-500',
    featured: true,
  },
  {
    key: 'team_elite',
    name: 'Team Elite',
    price: '$29.99/mo',
    subtitle: 'For study circles and mentors',
    creditsAdded: 1200,
    features: ['+1200 AI credits', 'Everything in Premium Pro', 'Shared dashboards and export reports'],
    accent: 'from-emerald-500 to-teal-500',
  },
];

const PremiumPlansModal = ({ isOpen, onClose, title = 'Upgrade to Premium' }) => {
  const { user, setUser, isAuthenticated } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentStep, setPaymentStep] = useState('choose_plan');
  const [processingPlan, setProcessingPlan] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paymentSessionId, setPaymentSessionId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpDeliveryMessage, setOtpDeliveryMessage] = useState('');
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [isLocalFallbackFlow, setIsLocalFallbackFlow] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [paymentStartedAt, setPaymentStartedAt] = useState(null);
  const [paymentCompletedAt, setPaymentCompletedAt] = useState(null);
  const [showSuccessBurst, setShowSuccessBurst] = useState(false);

  const currentCredits = useMemo(() => Number(user?.credits || 0), [user]);
  const selectedPlanProjectedCredits = selectedPlan ? currentCredits + selectedPlan.creditsAdded : currentCredits;
  const completionDurationText = useMemo(() => {
    if (!paymentStartedAt || !paymentCompletedAt) return 'N/A';
    const durationMs = Math.max(0, paymentCompletedAt - paymentStartedAt);
    const totalSeconds = durationMs / 1000;
    if (totalSeconds < 60) return `${totalSeconds.toFixed(1)} sec`;
    const mins = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${mins} min ${seconds} sec`;
  }, [paymentStartedAt, paymentCompletedAt]);

  const resetPaymentFlow = () => {
    setSelectedPlan(null);
    setPaymentStep('choose_plan');
    setProcessingPlan('');
    setIsProcessingPayment(false);
    setErrorMessage('');
    setCardNumber('');
    setUpiId('');
    setPaymentSessionId('');
    setOtpCode('');
    setOtpDeliveryMessage('');
    setEmailPreviewUrl('');
    setOtpHint('');
    setIsLocalFallbackFlow(false);
    setPaymentReceipt(null);
    setPaymentStartedAt(null);
    setPaymentCompletedAt(null);
    setShowSuccessBurst(false);
  };

  const handleClose = () => {
    resetPaymentFlow();
    onClose();
  };

  const handleSelectPlan = (plan) => {
    setErrorMessage('');
    setSelectedPlan(plan);
    setPaymentStep('enter_payment_details');
  };

  const handleInitiatePayment = async () => {
    if (!isAuthenticated) {
      setErrorMessage('Please login first to run the demo upgrade payment.');
      return;
    }

    if (!selectedPlan) {
      setErrorMessage('Please select a plan first.');
      return;
    }

    if (paymentMethod === 'credit_card') {
      if (cardNumber.replace(/\s/g, '').length < 12) {
        setErrorMessage('Please enter a valid card number.');
        return;
      }
    }

    if (paymentMethod === 'upi' && !upiId.includes('@')) {
      setErrorMessage('Please enter a valid UPI ID.');
      return;
    }

    try {
      setErrorMessage('');
      setIsProcessingPayment(true);
      setPaymentStartedAt(Date.now());

      const paymentDetails =
        paymentMethod === 'credit_card'
          ? { cardNumber }
          : paymentMethod === 'upi'
            ? { upiId }
            : {};

      const res = await api.post('/auth/demo-payment/initiate', {
        planKey: selectedPlan.key,
        paymentMethod,
        paymentDetails,
      });

      setPaymentSessionId(res.data?.paymentSessionId || '');
      setOtpDeliveryMessage(res.data?.otpMessage || 'OTP sent to your registered email.');
      setEmailPreviewUrl(res.data?.emailDelivery?.previewUrl || '');
      setOtpHint(res.data?.demoOtp || '');
      setIsLocalFallbackFlow(false);
      setPaymentStep('verify_otp');
    } catch (err) {
      const status = err?.response?.status;

      // Compatibility mode for older backend that has /demo-upgrade but not /demo-payment/* routes.
      if (status === 404) {
        const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
        setPaymentSessionId(`local_${Date.now()}`);
        setOtpHint(generatedOtp);
        setOtpDeliveryMessage(`LearnSphere Demo: OTP ${generatedOtp} sent to your registered email. Valid for 5 min.`);
        setEmailPreviewUrl('');
        setIsLocalFallbackFlow(true);
        setPaymentStep('verify_otp');
      } else {
        setErrorMessage(err?.response?.data?.message || 'Unable to initiate demo payment.');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentSessionId) {
      setErrorMessage('Payment session missing. Please initiate payment again.');
      return;
    }

    if (!otpCode || otpCode.length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP.');
      return;
    }

    try {
      setErrorMessage('');
      setProcessingPlan(selectedPlan?.key || 'verifying');

      let res;

      if (isLocalFallbackFlow) {
        if (otpCode !== otpHint) {
          setErrorMessage('Invalid OTP. Please use the demo OTP shown above.');
          return;
        }

        res = await api.post('/auth/demo-upgrade', {
          planKey: selectedPlan?.key,
          paymentMethod,
        });
      } else {
        res = await api.post('/auth/demo-payment/confirm', {
          paymentSessionId,
          otp: otpCode,
        });
      }

      if (res.data?.user) {
        setUser(res.data.user);
      }

      const defaultSuccessMessage = `Payment successful for ${selectedPlan?.name}. Credits updated successfully.`;
      setOtpDeliveryMessage(res.data?.confirmationMessage || defaultSuccessMessage);
      setEmailPreviewUrl(res.data?.emailDelivery?.previewUrl || '');

      const fallbackPreviousCredits = Math.max(0, Number(user?.credits || 0) - Number(selectedPlan?.creditsAdded || 0));
      const fallbackCurrentCredits = Number(user?.credits || 0);
      setPaymentReceipt({
        planName: res.data?.upgrade?.planName || selectedPlan?.name || 'Selected Plan',
        creditsAdded: Number(res.data?.upgrade?.creditsAdded ?? selectedPlan?.creditsAdded ?? 0),
        previousCredits: Number(res.data?.upgrade?.previousCredits ?? fallbackPreviousCredits),
        currentCredits: Number(res.data?.upgrade?.currentCredits ?? fallbackCurrentCredits),
        transactionId: res.data?.payment?.transactionId || `demo_${Date.now()}`,
        paymentMethod: res.data?.payment?.method || paymentMethod,
        emailMasked: res.data?.payment?.emailMasked || user?.email || 'N/A',
        mailSent: Boolean(res.data?.emailDelivery?.sent ?? true),
        mailProviderMode: res.data?.emailDelivery?.providerMode || 'smtp',
        mailPreviewUrl: res.data?.emailDelivery?.previewUrl || '',
        mailSentAt: new Date().toLocaleTimeString(),
        completedAt: new Date().toLocaleString(),
      });

      setPaymentCompletedAt(Date.now());
      setShowSuccessBurst(true);
      setTimeout(() => setShowSuccessBurst(false), 1400);
      setPaymentStep('completed');
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Payment verification failed. Please try again.');
    } finally {
      setProcessingPlan('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 bg-slate-950/70 backdrop-blur-sm">
      {paymentStep === 'choose_plan' ? (
        <div className="relative w-full max-w-6xl rounded-[2.2rem] overflow-hidden border border-white/10 shadow-2xl shadow-blue-900/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          <button
            type="button"
            onClick={handleClose}
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
              Step 1: Choose your premium plan. Payment and email OTP verification will open in a separate next box.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-xs md:text-sm px-3 py-1 rounded-full bg-white/10 border border-white/20">
                Current credits: <strong>{currentCredits}</strong>
              </span>
            </div>
            {errorMessage && (
              <p className="mt-3 text-sm text-rose-200 bg-rose-500/20 border border-rose-300/30 rounded-lg px-3 py-2 max-w-2xl">
                {errorMessage}
              </p>
            )}
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
                  onClick={() => handleSelectPlan(plan)}
                  className={`mt-7 w-full py-3 rounded-2xl font-black transition-all ${plan.featured ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-900/30' : 'bg-white/15 hover:bg-white/25 text-white'}`}
                >
                  Choose {plan.name}
                </button>

                <p className="mt-3 text-xs text-slate-300">
                  Credits after upgrade: {currentCredits + plan.creditsAdded}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-2xl rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl shadow-cyan-900/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close payment flow"
          >
            <X size={18} />
          </button>

          <div className="px-8 pt-10 pb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/20 text-cyan-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wide border border-cyan-300/30">
              <Crown size={14} /> Demo Payment Step
            </div>

            <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-4">
              {paymentStep === 'verify_otp' ? 'Step 3: Verify OTP' : paymentStep === 'completed' ? 'Payment Completed' : 'Step 2: Payment Details'}
            </h2>

            {paymentStep !== 'completed' && (
              <p className="mt-3 text-slate-200 text-sm md:text-base">
                Plan: <strong>{selectedPlan?.name}</strong> | Credits: <strong>{currentCredits}</strong> -&gt; <strong>{selectedPlanProjectedCredits}</strong>
              </p>
            )}

            {errorMessage && (
              <p className="mt-3 text-sm text-rose-200 bg-rose-500/20 border border-rose-300/30 rounded-lg px-3 py-2">
                {errorMessage}
              </p>
            )}

            {paymentStep === 'enter_payment_details' && (
              <div className="mt-5 space-y-4">
                <label className="text-sm text-slate-200 block">
                  Payment method
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 w-full bg-slate-900 border border-white/20 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="credit_card">Credit Card (Demo)</option>
                    <option value="upi">UPI (Demo)</option>
                  </select>
                </label>

                <p className="text-sm text-slate-300 bg-white/5 border border-white/15 rounded-lg px-3 py-2">
                  OTP will be sent to your registered account email: <strong>{user?.email || 'your email'}</strong>
                </p>

                {paymentMethod === 'credit_card' && (
                  <label className="text-sm text-slate-200 block">
                    Card number
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4111 1111 1111 1111"
                      className="mt-1 w-full rounded-lg bg-slate-900/80 border border-white/20 px-3 py-2 text-sm"
                    />
                  </label>
                )}

                {paymentMethod === 'upi' && (
                  <label className="text-sm text-slate-200 block">
                    UPI ID
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="name@upi"
                      className="mt-1 w-full rounded-lg bg-slate-900/80 border border-white/20 px-3 py-2 text-sm"
                    />
                  </label>
                )}
              </div>
            )}

            {paymentStep === 'verify_otp' && (
              <div className="mt-5">
                <p className="text-xs text-emerald-200 bg-emerald-500/20 border border-emerald-300/30 rounded-lg px-3 py-2">
                  {otpDeliveryMessage || 'OTP sent to your registered email.'}
                </p>
                {emailPreviewUrl && (
                  <p className="text-xs text-cyan-200 mt-2 break-all">
                    Email preview URL (dev): {emailPreviewUrl}
                  </p>
                )}
                {otpHint && (
                  <p className="text-xs text-amber-200 mt-2">
                    Demo OTP preview (for testing): <strong>{otpHint}</strong>
                  </p>
                )}

                <label className="block mt-3 text-sm text-slate-200 max-w-xs">
                  Enter OTP
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit OTP"
                    className="mt-1 w-full rounded-lg bg-slate-900/80 border border-white/20 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            )}

            {paymentStep === 'completed' && (
              <div className="mt-5 space-y-4">
                <div className="flex flex-col items-center text-center">
                  <div className="relative h-20 w-20 flex items-center justify-center">
                    {showSuccessBurst && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/35 animate-ping" />}
                    <span className="absolute inline-flex h-[72px] w-[72px] rounded-full bg-emerald-500/15" />
                    <span className="relative inline-flex h-14 w-14 rounded-full bg-emerald-500 items-center justify-center shadow-lg shadow-emerald-900/40 animate-bounce">
                      <CheckCircle2 size={28} className="text-white" />
                    </span>
                  </div>
                  <p className="mt-3 text-emerald-100 font-extrabold text-lg">Payment Successful</p>
                  <p className="text-xs text-emerald-50/90 mt-1">Transaction confirmed and receipt mail sent</p>
                </div>

                <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/20 px-4 py-3">
                  <p className="text-sm text-emerald-100 font-semibold">Payment successful</p>
                  <p className="text-xs text-emerald-50 mt-1">{otpDeliveryMessage}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
                  <p className="text-xs text-slate-300 uppercase tracking-wide">Payment Timeline</p>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg border border-emerald-300/20 bg-emerald-500/10 px-3 py-2">
                      <p className="text-emerald-100 font-semibold">1. Payment Processed</p>
                      <p className="text-slate-300 mt-1">Completed</p>
                    </div>
                    <div className="rounded-lg border border-cyan-300/20 bg-cyan-500/10 px-3 py-2">
                      <p className="text-cyan-100 font-semibold">2. OTP Verified</p>
                      <p className="text-slate-300 mt-1">Successful</p>
                    </div>
                    <div className="rounded-lg border border-blue-300/20 bg-blue-500/10 px-3 py-2">
                      <p className="text-blue-100 font-semibold">3. Receipt Mail Sent</p>
                      <p className="text-slate-300 mt-1">
                        {paymentReceipt?.mailSent ? `Sent at ${paymentReceipt?.mailSentAt}` : 'Pending'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-200">
                      Total completion time: <span className="font-bold text-white">{completionDurationText}</span>
                    </p>
                    <p className="text-xs text-slate-300">
                      Mail mode: <span className="uppercase font-semibold text-cyan-100">{paymentReceipt?.mailProviderMode || 'smtp'}</span>
                    </p>
                  </div>
                  {paymentReceipt?.mailPreviewUrl && (
                    <p className="text-xs text-cyan-200 mt-2 break-all">
                      Dev preview mail: {paymentReceipt.mailPreviewUrl}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 md:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base md:text-lg font-extrabold flex items-center gap-2">
                      <ReceiptText size={18} className="text-cyan-300" /> Payment Receipt
                    </h3>
                    <span className="text-xs px-3 py-1 rounded-full border border-emerald-300/30 bg-emerald-500/15 text-emerald-100">
                      Demo Verified
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2">
                      <p className="text-slate-400 text-xs">Plan</p>
                      <p className="text-white font-bold mt-0.5">{paymentReceipt?.planName || selectedPlan?.name}</p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2">
                      <p className="text-slate-400 text-xs">Transaction ID</p>
                      <p className="text-white font-semibold mt-0.5 break-all">{paymentReceipt?.transactionId || 'N/A'}</p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2">
                      <p className="text-slate-400 text-xs flex items-center gap-1">
                        <WalletCards size={13} /> Method
                      </p>
                      <p className="text-white font-semibold mt-0.5 uppercase">{String(paymentReceipt?.paymentMethod || paymentMethod).replace('_', ' ')}</p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2">
                      <p className="text-slate-400 text-xs flex items-center gap-1">
                        <CalendarClock size={13} /> Completed At
                      </p>
                      <p className="text-white font-semibold mt-0.5">{paymentReceipt?.completedAt || new Date().toLocaleString()}</p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 md:col-span-2">
                      <p className="text-slate-400 text-xs flex items-center gap-1">
                        <Mail size={13} /> Receipt Email
                      </p>
                      <p className="text-white font-semibold mt-0.5">{paymentReceipt?.emailMasked || user?.email || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-4 py-3">
                    <p className="text-xs text-cyan-100 uppercase tracking-wide">Credits Updated</p>
                    <p className="mt-1 text-lg md:text-xl font-black text-white">
                      {paymentReceipt?.previousCredits ?? 0} -&gt; {paymentReceipt?.currentCredits ?? Number(user?.credits || 0)}
                    </p>
                    <p className="text-xs text-cyan-100 mt-1">
                      Added +{paymentReceipt?.creditsAdded ?? selectedPlan?.creditsAdded ?? 0} credits
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {paymentStep === 'enter_payment_details' && (
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={isProcessingPayment}
                  className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold"
                >
                  {isProcessingPayment ? 'Sending OTP...' : 'Pay Now (Demo)'}
                </button>
              )}

              {paymentStep === 'verify_otp' && (
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={processingPlan === (selectedPlan?.key || '')}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold"
                >
                  {processingPlan === (selectedPlan?.key || '') ? 'Verifying...' : 'Verify OTP and Complete Payment'}
                </button>
              )}

              {paymentStep !== 'completed' && (
                <button
                  type="button"
                  onClick={resetPaymentFlow}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold"
                >
                  Back to Plans
                </button>
              )}

              {paymentStep === 'completed' && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumPlansModal;