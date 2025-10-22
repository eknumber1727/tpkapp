import React, { useEffect } from 'react';

const AdBanner: React.FC = () => {
  useEffect(() => {
    // A small delay gives the browser time to calculate the container's dimensions
    // before the AdSense script runs, preventing the "availableWidth=0" error.
    const timeoutId = setTimeout(() => {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }, 100);

    // Cleanup the timeout on component unmount
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="w-full flex items-center justify-center my-4">
      {/* 
        IMPORTANT: This is a placeholder Ad unit.
        Replace `ca-pub-YOUR_ADSENSE_ID` with your Google AdSense Publisher ID.
        Replace `1234567890` with your Ad unit's Slot ID.
      */}
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-YOUR_ADSENSE_ID"
        data-ad-slot="1234567890"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdBanner;