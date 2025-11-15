'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Box, Skeleton } from '@mui/material';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  skeletonHeight?: number | string;
  lazy?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  className,
  style,
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.svg',
  skeletonHeight = 200,
  lazy = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      onError?.();
    }
  }, [onError, fallbackSrc, currentSrc]);

  // Generate optimized sizes based on common breakpoints
  const defaultSizes = sizes || `
    (max-width: 640px) 100vw,
    (max-width: 1024px) 50vw,
    (max-width: 1280px) 33vw,
    25vw
  `;

  // Generate blur placeholder if not provided
  const generateBlurDataURL = (w: number = 10, h: number = 10) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, w, h);
    }
    return canvas.toDataURL();
  };

  const imageProps = {
    src: currentSrc,
    alt,
    quality,
    placeholder,
    ...(blurDataURL && { blurDataURL }),
    ...(fill ? { fill: true } : { width, height }),
    sizes: defaultSizes,
    priority: priority || !lazy,
    loading: (lazy && !priority ? 'lazy' : 'eager') as 'lazy' | 'eager',
    onLoad: handleLoad,
    onError: handleError,
    className,
    style: {
      objectFit: 'cover',
      ...style
    }
  };

  if (hasError && currentSrc === fallbackSrc) {
    return (
      <Box
        sx={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height || skeletonHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          color: 'grey.500',
          fontSize: '14px'
        }}
      >
        Image unavailable
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: fill ? '100%' : width,
        height: fill ? '100%' : height || skeletonHeight,
        overflow: 'hidden'
      }}
    >
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        />
      )}
      <Image
        {...imageProps}
        ref={imageRef}
        style={{
          ...imageProps.style,
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </Box>
  );
};

// Avatar optimized image component
interface OptimizedAvatarProps extends Omit<OptimizedImageProps, 'fill' | 'width' | 'height'> {
  size: number;
  fallbackInitial?: string;
}

export const OptimizedAvatar: React.FC<OptimizedAvatarProps> = ({
  size,
  fallbackInitial,
  alt,
  ...props
}) => {
  return (
    <OptimizedImage
      {...props}
      width={size}
      height={size}
      alt={alt || 'Avatar'}
      style={{
        borderRadius: '50%',
        ...props.style
      }}
      fallbackSrc={fallbackInitial ? 
        `data:image/svg+xml;base64,${btoa(`
          <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#e0e0e0"/>
            <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="${size*0.4}" fill="#666">
              ${fallbackInitial}
            </text>
          </svg>
        `)}` : 
        undefined
      }
    />
  );
};

// Background image component
interface OptimizedBackgroundProps {
  src: string;
  alt?: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
  priority?: boolean;
  quality?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const OptimizedBackground: React.FC<OptimizedBackgroundProps> = ({
  src,
  alt = 'Background image',
  children,
  overlay = false,
  overlayOpacity = 0.5,
  priority = false,
  quality = 75,
  className,
  style
}) => {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
      className={className}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={quality}
        style={{
          objectFit: 'cover',
          zIndex: -1
        }}
      />
      {overlay && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
            zIndex: 0
          }}
        />
      )}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Box>
    </Box>
  );
};