"use client";

import { useEffect, useState } from "react";

export default function LiveTimestamp() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!now) {
    return <span className="log-stamp" aria-label="Current time">— — — — — — —</span>;
  }

  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return (
    <span className="log-stamp" aria-live="off">
      {yyyy}-{mm}-{dd} · {hh}:{mi}:{ss}
    </span>
  );
}
