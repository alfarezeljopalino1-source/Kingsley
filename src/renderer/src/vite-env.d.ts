/// <reference types="vite/client" />

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.ico' {
  const content: string
  export default content
}

declare module '*.svg' {
  const content: string
  export default content
}

declare const __APP_BUILD_TIME__: string
declare const __APP_VERSION__: string
