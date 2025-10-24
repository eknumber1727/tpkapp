import React, { useEffect } from 'react';
import { useData } from '../../context/DataContext';

const AdBanner: React.FC = () => {
  const { appSettings } = useData();
  const { adsEnabled, adSensePublisherId, adSenseSlotId } = appSettings;

  useEffect(() => {
    // Only attempt to push to adsbygoogle if the component is going to render an ad
    if (adsEnabled && adSensePublisherId && adSenseSlotId) {
      const timeoutId = setTimeout(() => {
        try {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.error("AdSense error:", e);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [adsEnabled, adSensePublisherId, adSenseSlotId]);

  // If ads are disabled or keys are missing, render nothing.
  if (!adsEnabled || !adSensePublisherId || !adSenseSlotId) {
    return null;
  }

  return (
    <div className="w-full flex items-center justify-center my-4">
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={adSensePublisherId}
        data-ad-slot={adSenseSlotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdBanner;