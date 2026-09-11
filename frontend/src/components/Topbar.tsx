import { useEffect, useState } from "react";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function Topbar({ title, sub }: { title: string; sub: string }) {
  const now = useClock();
  const hora = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const data = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div className="topbar reveal d1">
      <div>
        <div className="eyebrow">EnergiaWatch · Tempo real</div>
        <h2>{title}</h2>
        <div className="sub">{sub}</div>
      </div>
      <div className="clock">
        <div className="time mono">{hora}</div>
        <div>{data}</div>
      </div>
    </div>
  );
}
