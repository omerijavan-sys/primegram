import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Moon, Lock, Bell, HelpCircle, LogOut, ChevronRight, User, Shield, Palette, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRoles } from "@/hooks/useRole";
import { readPreference, savePreference, Theme } from "@/utils/preferences";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Panel = null | "profile" | "notifications" | "privacy" | "security" | "appearance" | "darkmode" | "help";

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <Switch checked={on} onCheckedChange={onToggle} aria-label="Toggle setting" />
);

const SettingsPage = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isAdmin } = useRoles();
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  // Toggle states
  const [notifToggles, setNotifToggles] = useState(() => readPreference("notifications", { push: false, messages: true }));
  const [privToggles, setPrivToggles] = useState({ private: false, activity: true, tags: true, dms: true });
  const [reduceAnimations, setReduceAnimations] = useState(() => readPreference("reduce-motion", false));
  const [theme, setThemeState] = useState<Theme>(() => readPreference("theme", "dark"));
  const darkMode = theme !== "light";
  const setTheme = (value: Theme) => { setThemeState(value); savePreference("theme", value); };
  const setDarkMode = (value: boolean) => setTheme(value ? "dark" : "light");
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const handleSignOut = async () => { await signOut(); toast.success("Signed out"); navigate("/auth"); };

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("display_name, username, bio").eq("user_id", user.id).single();
    if (data) { setDisplayName(data.display_name || ""); setUsername(data.username || ""); setBio(data.bio || ""); }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName, username, bio }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Failed to save"); else toast.success("Profile updated!");
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Password changed!"); setNewPassword(""); setChangingPassword(false); }
  };

  const sections = [
    { icon: User, label: "Edit Profile", desc: "Update your info", panel: "profile" as Panel, onOpen: loadProfile },
    { icon: Bell, label: "Notifications", desc: "Messages & browser alerts", panel: "notifications" as Panel },
    { icon: Lock, label: "Privacy", desc: "Account privacy settings", panel: "privacy" as Panel },
    { icon: Shield, label: "Security", desc: "Password & 2FA", panel: "security" as Panel },
    { icon: Palette, label: "Appearance", desc: "Theme & display", panel: "appearance" as Panel },
    { icon: Moon, label: "Dark Mode", desc: darkMode ? "On" : "Off", panel: "darkmode" as Panel },
    { icon: HelpCircle, label: "Help & Support", desc: "FAQs and contact", panel: "help" as Panel },
  ];

  const renderPanel = () => {
    switch (activePanel) {
      case "profile":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-caption text-muted-foreground block mb-1.5">Display Name</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm outline-none" />
            </div>
            <div>
              <label className="text-caption text-muted-foreground block mb-1.5">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm outline-none" />
            </div>
            <div>
              <label className="text-caption text-muted-foreground block mb-1.5">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm outline-none resize-none h-20" />
            </div>
            <button onClick={saveProfile} disabled={saving} className="depth-press w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        );
      case "notifications":
        return (
          <div className="space-y-3">
            {Object.entries(notifToggles).map(([key, val]) => (
              <div key={key} className="liquid-glass rounded-2xl p-4 flex items-center justify-between relative z-10">
                <span className="text-sm text-foreground capitalize">{key.replace(/([A-Z])/g, " $1")} Notifications</span>
                <Toggle on={val} onToggle={async () => {
                  if (key === "push" && !val) {
                    if (!("Notification" in window)) { toast.error("Browser notifications are unavailable."); return; }
                    if (await Notification.requestPermission() !== "granted") { toast.error("Allow notifications in your browser settings."); return; }
                  }
                  const next = { ...notifToggles, [key]: !val };
                  setNotifToggles(next); savePreference("notifications", next);
                }} />
              </div>
            ))}
          </div>
        );
      case "privacy":
        return (
          <div className="space-y-3">
            {[
              { key: "private", label: "Private Account" },
              { key: "activity", label: "Show Activity Status" },
              { key: "tags", label: "Allow Tags from Everyone" },
              { key: "dms", label: "Allow Messages from Everyone" },
            ].map(item => (
              <div key={item.key} className="liquid-glass rounded-2xl p-4 flex items-center justify-between relative z-10">
                <span className="text-sm text-foreground">{item.label}</span>
                <Toggle on={privToggles[item.key as keyof typeof privToggles]} onToggle={() => setPrivToggles(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))} />
              </div>
            ))}
          </div>
        );
      case "security":
        return (
          <div className="space-y-3">
            <button onClick={() => setChangingPassword(!changingPassword)} className="depth-press liquid-glass rounded-2xl p-4 w-full text-left relative z-10">
              <p className="text-sm font-semibold text-foreground mb-1">Change Password</p>
              <p className="text-caption text-muted-foreground">Update your password regularly</p>
            </button>
            {changingPassword && (
              <div className="space-y-3 px-1">
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" className="w-full px-4 py-3 rounded-2xl bg-secondary/50 text-foreground text-sm outline-none" />
                <button onClick={changePassword} disabled={saving} className="depth-press w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                  {saving ? "..." : "Update Password"}
                </button>
              </div>
            )}
            <div className="liquid-glass rounded-2xl p-4 relative z-10">
              <p className="text-sm font-semibold text-foreground mb-1">Two-Factor Authentication</p>
              <p className="text-caption text-muted-foreground">Coming soon</p>
            </div>
            <div className="liquid-glass rounded-2xl p-4 relative z-10">
              <p className="text-sm font-semibold text-foreground mb-1">Login Activity</p>
              <p className="text-caption text-muted-foreground">Current session active</p>
            </div>
          </div>
        );
      case "appearance":
        return (
          <div className="space-y-3">
            <div className="liquid-glass rounded-2xl p-4 relative z-10">
              <p className="text-sm font-semibold text-foreground mb-2">App Theme</p>
              <div className="flex gap-2">
                {(["dark", "light", "auto"] as const).map(t => (
                  <Button key={t} variant={theme === t ? "default" : "secondary"} onClick={() => setTheme(t)} className="flex-1 capitalize">
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <div className="liquid-glass rounded-2xl p-4 flex items-center justify-between relative z-10">
              <span className="text-sm text-foreground">Reduce Animations</span>
              <Toggle on={reduceAnimations} onToggle={() => { setReduceAnimations(!reduceAnimations); savePreference("reduce-motion", !reduceAnimations); }} />
            </div>
          </div>
        );
      case "darkmode":
        return (
          <div className="space-y-3">
            <div className="liquid-glass rounded-2xl p-4 flex items-center gap-3 relative z-10">
              {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Dark Mode {darkMode ? "Active" : "Off"}</p>
                <p className="text-caption text-muted-foreground">Easier on the eyes in low light</p>
              </div>
              <Toggle on={darkMode} onToggle={() => setDarkMode(!darkMode)} />
            </div>
          </div>
        );
      case "help":
        return (
          <div className="space-y-3">
            {[
              { label: "FAQ", action: () => toast.info("FAQ: Visit our help center for common questions") },
              { label: "Contact Support", action: () => toast.info("Email: support@primegram.app") },
              { label: "Report a Problem", action: () => toast.info("Please describe the issue and we'll look into it") },
              { label: "Terms of Service", action: () => toast.info("Terms of Service - Primegram 2026") },
              { label: "Privacy Policy", action: () => toast.info("Your data is secure with Primegram") },
              { label: "About Primegram", action: () => toast.info("Primegram v1.0 - Created by Java Prime, Sponsored by JP7 ULTRA") },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="depth-press liquid-glass rounded-2xl p-4 flex items-center justify-between w-full text-left relative z-10">
                <span className="text-sm text-foreground">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="liquid-glass-elevated safe-area-top">
        <div className="flex items-center gap-3 px-5 py-4 relative z-10">
          <button onClick={() => activePanel ? setActivePanel(null) : navigate(-1)} className="depth-press">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-headline text-foreground text-base">
            {activePanel ? sections.find(s => s.panel === activePanel)?.label || "Settings" : "Settings"}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activePanel ? (
          <motion.div key={activePanel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 max-w-2xl mx-auto">
            {renderPanel()}
          </motion.div>
        ) : (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 max-w-2xl mx-auto space-y-1">
            {sections.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { setActivePanel(item.panel); item.onOpen?.(); }}
                className="depth-press border-b border-border py-4 flex items-center gap-3 w-full text-left relative z-10"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-caption text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            ))}
            {isAdmin && (
              <motion.button
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                onClick={() => navigate("/admin")}
                className="depth-press liquid-glass rounded-2xl p-4 flex items-center gap-3 w-full text-left relative z-10 border border-primary/30"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Admin Console</p>
                  <p className="text-caption text-muted-foreground">Moderation, users, reports & audit log</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            )}
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} onClick={handleSignOut}
              className="depth-press w-full mt-4 py-3 rounded-2xl liquid-glass text-destructive text-sm font-semibold flex items-center justify-center gap-2 relative z-10">
              <LogOut className="w-4 h-4" /> Sign Out
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
