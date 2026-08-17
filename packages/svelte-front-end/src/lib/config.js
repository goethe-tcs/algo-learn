/** This file contains the configuration for the application. */

// The base URL of the application. Useful if project is deployed to a subdirectory.
// prettier-ignore
export const BASENAME = import.meta.env?.VITE_PUBLIC_BASE_PATH ?? (typeof process !== "undefined" ? (process.env?.VITE_PUBLIC_BASE_PATH ?? "") : "")

// The version of the application.
// prettier-ignore
export const VERSION = "local build" // Note: This is set in the CI pipeline!
