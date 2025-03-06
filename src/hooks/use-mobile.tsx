import * as React from "react"

// More comprehensive mobile detection
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkIfMobile = () => {
      // User agent detection for mobile devices
      const userAgent = navigator.userAgent || navigator.vendor || ''
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i
      
      // Check if it's a mobile device based on user agent
      if (mobileRegex.test(userAgent.toLowerCase())) {
        return true
      }
      
      // Additional check for touch devices
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        // For tablets, we might want to check screen size to differentiate large tablets
        // Screen size check - consider devices with smaller screens as mobile
        const smallerDimension = Math.min(window.innerWidth, window.innerHeight)
        const largerDimension = Math.max(window.innerWidth, window.innerHeight)
        
        // If the device has a small screen in either dimension, consider it mobile
        // This catches phones in both portrait and landscape
        if (smallerDimension < 600 || largerDimension < 900) {
          return true
        }
      }
      
      return false
    }

    // Initial check
    setIsMobile(checkIfMobile())
    
    // Add resize listener to handle orientation changes
    const handleResize = () => {
      setIsMobile(checkIfMobile())
    }
    
    window.addEventListener('resize', handleResize)
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return isMobile
}

