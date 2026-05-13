"use client";

import Script from "next/script";

export function LemonSqueezyAffiliate() {
  return (
    <>
      <Script
        id="lemon-squeezy-affiliate-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.lemonSqueezyAffiliateConfig = { store: "aranora" };`,
        }}
      />
      <Script
        src="https://lmsqueezy.com/affiliate.js"
        strategy="afterInteractive"
        defer
      />
    </>
  );
}
