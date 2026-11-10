import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, X, CreditCard, History, Smartphone, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import GlassTabBar from "@/components/GlassTabBar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FunctionsHttpError } from "@supabase/supabase-js";

interface Transaction {
  id: string;
  type: "send" | "receive" | "topup";
  amount: number;
  counterparty: string | null;
  created_at: string;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

const kes = (n: number) => `KES ${Number(n).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;

const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"send" | "receive" | "topup" | null>(null);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [awaitingPin, setAwaitingPin] = useState(false);
  const [topupResult, setTopupResult] = useState<"paid" | "cancelled" | "failed" | null>(null);
  const pollRef = useRef<number | null>(null);

  const balance = transactions.reduce((b, t) => b + (t.type === "send" ? -Number(t.amount) : Number(t.amount)), 0);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("id, type, amount, counterparty, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load wallet");
    else setTransactions((data as Transaction[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const closeModal = () => {
    stopPolling();
    setModal(null);
    setAmount(""); setRecipient(""); setPhone("");
    setPaying(false); setAwaitingPin(false); setTopupResult(null);
  };

  const startPolling = (topupId: string, amt: number) => {
    setAwaitingPin(true);
    let attempts = 0;
    pollRef.current = window.setInterval(async () => {
      attempts += 1;
      if (attempts > 50) {
        stopPolling();
        setAwaitingPin(false);
        toast.error("Payment not confirmed in time. If you entered your PIN, the amount will show once Safaricom confirms.");
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("mpesa-topup-status", {
          body: { topupId },
        });
        if (error) return;
        if (data?.status === "paid") {
          stopPolling();
          setAwaitingPin(false);
          setTopupResult("paid");
          toast.success(`Top-up received! ${kes(amt)} added to your wallet.`);
          load();
        } else if (data?.status === "cancelled" || data?.status === "failed") {
          stopPolling();
          setAwaitingPin(false);
          setTopupResult(data.status);
          toast.error(data.status === "cancelled" ? "You cancelled the payment." : "The payment failed. Please try again.");
        }
      } catch {
        // transient — keep polling
      }
    }, 3000);
  };

  const handleTopUp = async () => {
    if (!user || paying) return;
    const amt = parseFloat(amount);
    if (!amt || amt < 10) { toast.error("Minimum top-up is KES 10"); return; }
    if (amt > 150000) { toast.error("Maximum top-up is KES 150,000"); return; }
    const digits = phone.replace(/\D/g, "").replace(/^254/, "").replace(/^0/, "");
    if (!/^(7|1)\d{8}$/.test(digits)) {
      toast.error("Enter your Safaricom number, e.g. 0712 345 678");
      return;
    }
    setPaying(true);
    setTopupResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("mpesa-topup", {
        body: { phone, amount: Math.round(amt) },
      });
      if (error) {
        const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
        let msg = "Payment could not start. Please try again.";
        try { msg = JSON.parse(details).error || msg; } catch { /* keep default */ }
        toast.error(msg);
        return;
      }
      toast.info(
        data?.mode === "sandbox"
          ? "Sandbox test mode: this payment runs on Safaricom's test system — no real money moves."
          : data?.message || "Check your phone and enter your M-Pesa PIN"
      );
      startPolling(data.topupId, Math.round(amt));
    } catch (e) {
      toast.error("Payment could not start. Check your connection and try again.");
    } finally {
      setPaying(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (modal === "topup") { handleTopUp(); return; }

    // "Receive" is not a client action: funds arrive when another user sends them.
    if (modal === "receive") {
      toast.info("Share your username so others can send you funds.");
      return;
    }

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (!recipient.trim()) { toast.error("Enter recipient username"); return; }

    // Balance check, recipient lookup and the paired debit/credit all happen
    // atomically server-side.
    const { data, error } = await supabase.rpc("wallet_send", {
      _recipient: recipient.trim(),
      _amount: amt,
    });
    if (error) { toast.error(error.message || "Transaction failed"); return; }
    const sent = Array.isArray(data) ? Number(data[0]?.transfer_amount ?? amt) : amt;
    toast.success(`Sent ${kes(sent)} to ${recipient.trim()}`);
    closeModal();
    load();
  };

  const txIcon = (type: string) => {
    if (type === "send") return <ArrowUpRight className="w-4 h-4 text-red-400" />;
    if (type === "receive") return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
    return <Plus className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="liquid-glass-elevated safe-area-top">
        <div className="flex items-center gap-3 px-5 py-4 relative z-10">
          <button onClick={() => navigate(-1)} className="depth-press"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
          <CreditCard className="w-5 h-5 text-primary" />
          <span className="text-headline text-foreground text-base">Prime Wallet</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="liquid-glass-elevated rounded-3xl p-6 relative z-10">
          <div className="text-center mb-5">
            <p className="text-caption text-muted-foreground mb-1">Prime Balance</p>
            <p className="text-4xl text-display text-foreground">{kes(balance)}</p>
            <p className="text-xs text-muted-foreground mt-1">{transactions.length} transactions · real money via M-Pesa</p>
          </div>
          <div className="flex justify-center gap-5">
            {[
              { icon: Plus, label: "Top Up", action: () => setModal("topup") },
              { icon: ArrowUpRight, label: "Send", action: () => setModal("send") },
              { icon: ArrowDownLeft, label: "Receive", action: () => setModal("receive") },
            ].map(({ icon: Icon, label, action }) => (
              <button key={label} onClick={action} className="depth-press flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-caption text-foreground">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="liquid-glass rounded-2xl relative z-10">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Transactions</span>
          </div>
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center">
              <WalletIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground">Top up to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {transactions.map(tx => (
                <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl liquid-glass-subtle flex items-center justify-center">{txIcon(tx.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">{tx.type === "topup" ? "M-Pesa Top Up" : tx.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.counterparty ? `${tx.type === "send" ? "To" : "From"}: ${tx.counterparty} · ` : ""}
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === "send" ? "text-red-400" : "text-green-400"}`}>
                    {tx.type === "send" ? "-" : "+"}{kes(Number(tx.amount))}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-background/90 backdrop-blur-xl flex items-end justify-center" onClick={closeModal}>
            <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="liquid-glass-elevated rounded-t-3xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center relative z-10">
                <h3 className="text-lg font-semibold text-foreground capitalize">{modal === "topup" ? "Top Up with M-Pesa" : modal}</h3>
                <button onClick={closeModal} className="depth-press w-8 h-8 rounded-full liquid-glass-subtle flex items-center justify-center"><X className="w-4 h-4 text-foreground" /></button>
              </div>

              {modal === "topup" && awaitingPin ? (
                <div className="relative z-10 py-8 text-center space-y-4">
                  {topupResult === "paid" ? (
                    <>
                      <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
                      <p className="text-sm text-foreground">Payment received — your balance is updated.</p>
                      <button onClick={closeModal} className="depth-press w-full py-3.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold">Done</button>
                    </>
                  ) : topupResult ? (
                    <>
                      <XCircle className="w-14 h-14 text-red-400 mx-auto" />
                      <p className="text-sm text-foreground">{topupResult === "cancelled" ? "You cancelled the payment." : "The payment failed."}</p>
                      <button onClick={closeModal} className="depth-press w-full py-3.5 rounded-2xl bg-secondary text-foreground text-sm font-semibold">Close</button>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-14 h-14 text-primary mx-auto animate-pulse" />
                      <p className="text-sm font-medium text-foreground">Enter your M-Pesa PIN on your phone</p>
                      <p className="text-xs text-muted-foreground">A prompt for {kes(parseFloat(amount) || 0)} was sent to {phone}. Waiting for confirmation…</p>
                      <Loader2 className="w-5 h-5 text-primary mx-auto animate-spin" />
                    </>
                  )}
                </div>
              ) : (
                <>
                  {modal === "topup" && (
                    <div className="relative z-10">
                      <label className="text-caption text-muted-foreground block mb-1.5">M-Pesa phone number</label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="0712 345 678"
                          inputMode="tel"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                  )}
                  {modal === "send" && (
                    <div className="relative z-10">
                      <label className="text-caption text-muted-foreground block mb-1.5">Recipient</label>
                      <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Username" className="w-full px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  )}
                  <div className="relative z-10">
                    <label className="text-caption text-muted-foreground block mb-1.5">Amount (KES)</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" min={modal === "topup" ? 10 : 0} step="1" className="w-full px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-2xl font-bold outline-none focus:ring-2 focus:ring-primary/30 text-center" />
                    {modal === "topup" && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {QUICK_AMOUNTS.map(q => (
                          <button key={q} onClick={() => setAmount(String(q))} className="depth-press px-3.5 py-1.5 rounded-full bg-secondary/60 text-xs font-medium text-foreground">
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={paying}
                    className="depth-press w-full py-3.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold relative z-10 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {paying && <Loader2 className="w-4 h-4 animate-spin" />}
                    {modal === "topup" ? "Pay with M-Pesa" : modal === "send" ? "Send Money" : "Confirm"}
                  </button>
                  {modal === "topup" && (
                    <p className="text-xs text-muted-foreground text-center relative z-10">You'll get an STK push — enter your M-Pesa PIN to confirm.</p>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <GlassTabBar />
    </div>
  );
};

export default WalletPage;
