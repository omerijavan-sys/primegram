import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PrimeLogo from "@/components/PrimeLogo";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <form onSubmit={submit} className="liquid-glass-elevated rounded-3xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center gap-2 justify-center">
          <PrimeLogo size={40} />
          <h1 className="text-xl text-display text-foreground">Set new password</h1>
        </div>
        <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl bg-muted px-4 py-3 text-foreground outline-none" />
        <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-xl bg-muted px-4 py-3 text-foreground outline-none" />
        <button disabled={loading} className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold depth-press">
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
