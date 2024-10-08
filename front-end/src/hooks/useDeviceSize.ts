import { useEffect, useState } from "react"

/** Device breakpoints for responsive design for tailwind css */
const deviceBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
}

/**
 * This function checks if the device is smaller than the preferred breakpoint.
 *
 * @returns useDeviceSize - if the device is smaller than or equal to the preferred breakpoint
 */
export function useDeviceSize(): keyof typeof deviceBreakpoints {
  const [deviceSize, setDeviceSize] = useState<keyof typeof deviceBreakpoints>("md")

  useEffect(() => {
    const handleResize = () => {
      // set it to the next greater breakpoint
      const width = window.innerWidth
      const size = (Object.keys(deviceBreakpoints) as Array<keyof typeof deviceBreakpoints>).find(
        (key) => width <= deviceBreakpoints[key],
      )
      setDeviceSize(size ? size : "2xl")
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return deviceSize
}
