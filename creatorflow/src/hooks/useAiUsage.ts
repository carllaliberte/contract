import { useEffect, useState } from "react";
import { getAiUsage, subscribeAiUsage } from "../lib/aiUsage";

export function useAiUsage() {
  const [usage, setUsage] = useState(() => getAiUsage());

  useEffect(() => {
    return subscribeAiUsage(() => setUsage(getAiUsage()));
  }, []);

  return usage;
}
