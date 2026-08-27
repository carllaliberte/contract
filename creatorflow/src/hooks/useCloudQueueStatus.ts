import { useEffect, useState } from "react";
import { getCloudQueueLength, subscribeCloudQueue } from "../lib/cloudQueue";
import { useNetworkStatus } from "./useNetworkStatus";

export function useCloudQueueStatus() {
  const online = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(getCloudQueueLength());

  useEffect(() => {
    return subscribeCloudQueue(() => setPendingCount(getCloudQueueLength()));
  }, []);

  return { online, pendingCount };
}
