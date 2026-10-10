"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RevenueForecastPage from "../forecast/revenue/page";

export default function WhatIfRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Gracefully update address bar to canonical route /forecast/revenue
    router.replace("/forecast/revenue");
  }, [router]);

  return <RevenueForecastPage />;
}
