import { useEffect, useState } from "react";

export type AtlasViewportProfile = {
  width: number;
  devicePixelRatio: number;
  mobile: boolean;
};

const INITIAL_PROFILE: AtlasViewportProfile = {
  width: 0,
  devicePixelRatio: 1,
  mobile: false,
};

/** Publishes at most once per animation frame while a window is resizing. */
export function useAtlasViewportProfile(): AtlasViewportProfile {
  const [profile, setProfile] = useState(INITIAL_PROFILE);

  useEffect(() => {
    let frame = 0;
    const publish = () => {
      frame = 0;
      const width = window.innerWidth;
      const devicePixelRatio = window.devicePixelRatio || 1;
      setProfile((current) => {
        const mobile = width < 640;
        return current.width === width &&
          current.devicePixelRatio === devicePixelRatio &&
          current.mobile === mobile
          ? current
          : { width, devicePixelRatio, mobile };
      });
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(publish);
    };
    publish();
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return profile;
}
