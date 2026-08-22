import { useMediaQuery } from "@uidotdev/usehooks";

/**
 * Custom hook to check if viewport is desktop size.
 * @returns {boolean} True if viewport width >= 768px
 */
export const useIsDesktop = () => {
  return useMediaQuery("(min-width: 768px)");
};
