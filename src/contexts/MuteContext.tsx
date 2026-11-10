import { createContext, useContext, useState, ReactNode } from "react";

interface MuteContextValue {
  muted: boolean;
  toggleMuted: () => void;
  setMuted: (v: boolean) => void;
}

const MuteContext = createContext<MuteContextValue>({
  muted: true,
  toggleMuted: () => {},
  setMuted: () => {},
});

export const MuteProvider = ({ children }: { children: ReactNode }) => {
  const [muted, setMuted] = useState(true);
  return (
    <MuteContext.Provider value={{ muted, toggleMuted: () => setMuted((m) => !m), setMuted }}>
      {children}
    </MuteContext.Provider>
  );
};

export const useMute = () => useContext(MuteContext);
