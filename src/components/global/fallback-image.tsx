"use client"

import Image from "next/image"
import { useState } from "react"

interface FallbackImageProps {
  src: string | null | undefined
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
}

export const FallbackImage = ({
  src,
  alt,
  width,
  height,
  priority = false,
  className = "",
}: FallbackImageProps) => {
  // Ensure src is a valid URL or starts with a slash
  const getValidImageSrc = (url: string | null | undefined): string => {
    if (!url) return "/vercel.svg"
    if (url.startsWith("http://") || url.startsWith("https://")) return url
    if (url.startsWith("/")) return url
    return "/vercel.svg"
  }

  const [imgSrc, setImgSrc] = useState<string>(getValidImageSrc(src))

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      onError={() => setImgSrc("/vercel.svg")}
    />
  )
} 