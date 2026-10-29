"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ recordId: string }>;
}

export default function AnomalyDetailRedirectPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect to main anomaly overview page where details are rendered in-page via Modal
    router.replace(`/anomaly-detection`);
  }, [router, resolvedParams.recordId]);

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex items-center justify-center p-6 text-slate-600">
      <div className="text-center space-y-2">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold">Redirecting to Anomaly Detection Overview...</p>
      </div>
    </div>
  );
}
