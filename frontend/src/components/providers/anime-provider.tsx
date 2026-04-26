'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { AnimeConfig } from '@/types/additional'
import * as React from 'react'


// ANIME CONTEXT TYPE
interface AnimeContextType {
  anime: any | null
  isLoaded: boolean
  isAnimating: boolean
  activeAnimations: Map<string, any>
  createAnimation: (config: any, id?: string) => Promise<any>
  stopAnimation: (id: string) => void
  stopAllAnimations: () => void
  pauseAnimation: (id: string) => void
  playAnimation: (id: string) => void
  restartAnimation: (id: string) => void
}

// ANIME CONTEXT
const AnimeContext = createContext<AnimeContextType>({
  anime: null,
  isLoaded: false,
  isAnimating: false,
  activeAnimations: new Map(),
  createAnimation: async () => null,
  stopAnimation: () => {},
  stopAllAnimations: () => {},
  pauseAnimation: () => {},
  playAnimation: () => {},
  restartAnimation: () => {},
})

// ANIME PROVIDER PROPS
interface AnimeProviderProps {
  children: ReactNode
}

// CONFIGURACIONES PREDEFINIDAS PARA FURNIBLES
export const animePresets = {
  // Animación de entrada para hero text
  heroTextReveal: {
    opacity: [0, 1],
    translateY: [50, 0],
    duration: 1200,
    delay: (el: any, i: number) => i * 100,
    easing: 'easeOutExpo',
  },

  // Animación de fade in suave
  fadeIn: {
    opacity: [0, 1],
    duration: 800,
    easing: 'easeOutQuad',
  },

  // Animación de slide desde abajo
  slideUp: {
    translateY: [100, 0],
    opacity: [0, 1],
    duration: 800,
    easing: 'easeOutCubic',
  },

  // Animación de slide desde la izquierda
  slideInLeft: {
    translateX: [-100, 0],
    opacity: [0, 1],
    duration: 800,
    easing: 'easeOutCubic',
  },

  // Animación de slide desde la derecha
  slideInRight: {
    translateX: [100, 0],
    opacity: [0, 1],
    duration: 800,
    easing: 'easeOutCubic',
  },

  // Animación de escala suave
  scaleIn: {
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 600,
    easing: 'easeOutBack',
  },

  // Animación de bounce suave
  bounceIn: {
    scale: [0, 1],
    opacity: [0, 1],
    duration: 800,
    easing: 'easeOutElastic(1, .6)',
  },

  // Animación de rotación para logos
  rotateIn: {
    rotate: [-180, 0],
    opacity: [0, 1],
    duration: 1000,
    easing: 'easeOutBack',
  },

  // Animación de loading spinner
  spin: {
    rotate: '1turn',
    duration: 1000,
    easing: 'linear',
    loop: true,
  },

  // Animación de pulso para botones
  pulse: {
    scale: [1, 1.05, 1],
    duration: 1500,
    easing: 'easeInOutSine',
    loop: true,
  },

  // Animación de flotación
  float: {
    translateY: [-10, 10],
    duration: 2000,
    direction: 'alternate',
    easing: 'easeInOutSine',
    loop: true,
  },

  // Animación de escritura de texto
  typeWriter: {
    width: ['0%', '100%'],
    duration: 2000,
    easing: 'steps(40, end)',
  },

  // Animación de stagger para listas
  staggerFadeIn: {
    opacity: [0, 1],
    translateY: [30, 0],
    duration: 600,
    delay: (el: any, i: number) => i * 150,
    easing: 'easeOutQuad',
  },

  // Animación de cards para productos
  cardHover: {
    scale: [1, 1.03],
    translateY: [0, -5],
    duration: 300,
    easing: 'easeOutQuad',
  },

  // Animación de salida rápida
  fadeOut: {
    opacity: [1, 0],
    duration: 400,
    easing: 'easeOutQuad',
  },

  // Animación para modales
  modalEnter: {
    scale: [0.9, 1],
    opacity: [0, 1],
    duration: 300,
    easing: 'easeOutQuad',
  },

  // Animación para tooltips
  tooltipShow: {
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 200,
    easing: 'easeOutBack',
  },
}

export function AnimeProvider({ children }: AnimeProviderProps) {
  const [anime, setAnime] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [activeAnimations] = useState(new Map<string, any>())

  // Cargar anime.js
  useEffect(() => {
    const loadAnime = async () => {
      try {
        const animeModule = await import('animejs/lib/anime.es.js')
        setAnime(animeModule.default)
        setIsLoaded(true)
      } catch (error) {
        console.error('❌ Error cargando anime.js:', error)
      }
    }

    loadAnime()
  }, [])

  // Crear animación
  const createAnimation = useCallback(async (config: AnimeConfig, id?: string): Promise<any> => {
    if (!anime) {
      console.warn('Anime.js no está cargado aún')
      return null
    }

    try {
      setIsAnimating(true)

      // Generar ID único si no se proporciona
      const animationId = id || `anime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Configuración base con callbacks
      const animationConfig = {
        ...config,
        begin: (anim: any) => {
          if (config.begin) config.begin(anim)
        },
        complete: (anim: any) => {
          if (config.complete) config.complete()
          activeAnimations.delete(animationId)
          if (activeAnimations.size === 0) {
            setIsAnimating(false)
          }
        },
        update: (anim: any) => {
          if (config.update) config.update(anim)
        },
      }

      // Crear y guardar animación
      const animation = anime(animationConfig)
      activeAnimations.set(animationId, animation)

      return animation
    } catch (error) {
      console.error('❌ Error creando animación:', error)
      setIsAnimating(false)
      return null
    }
  }, [anime, activeAnimations])

  // Parar animación específica
  const stopAnimation = useCallback((id: string) => {
    const animation = activeAnimations.get(id)
    if (animation) {
      animation.pause()
      animation.seek(0)
      activeAnimations.delete(id)
    }
  }, [activeAnimations])

  // Parar todas las animaciones
  const stopAllAnimations = useCallback(() => {
    activeAnimations.forEach((animation, id) => {
      animation.pause()
      animation.seek(0)
    })
    activeAnimations.clear()
    setIsAnimating(false)
  }, [activeAnimations])

  // Pausar animación
  const pauseAnimation = useCallback((id: string) => {
    const animation = activeAnimations.get(id)
    if (animation) {
      animation.pause()
    }
  }, [activeAnimations])

  // Reproducir animación
  const playAnimation = useCallback((id: string) => {
    const animation = activeAnimations.get(id)
    if (animation) {
      animation.play()
    }
  }, [activeAnimations])

  // Reiniciar animación
  const restartAnimation = useCallback((id: string) => {
    const animation = activeAnimations.get(id)
    if (animation) {
      animation.restart()
    }
  }, [activeAnimations])

  // Limpiar animaciones al desmontar
  useEffect(() => {
    return () => {
      stopAllAnimations()
    }
  }, [stopAllAnimations])

  const contextValue: AnimeContextType = {
    anime,
    isLoaded,
    isAnimating,
    activeAnimations,
    createAnimation,
    stopAnimation,
    stopAllAnimations,
    pauseAnimation,
    playAnimation,
    restartAnimation,
  }

  return (
    <AnimeContext.Provider value={contextValue}>
      {children}
    </AnimeContext.Provider>
  )
}

// HOOK PARA USAR ANIME
export function useAnime() {
  const context = useContext(AnimeContext)
  if (!context) {
    throw new Error('useAnime debe ser usado dentro de AnimeProvider')
  }
  return context
}

// HOOK PARA ANIMACIONES PREDEFINIDAS
export function useAnimePresets() {
  const { createAnimation, isLoaded } = useAnime()

  return {
    // Animaciones de entrada
    fadeIn: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.fadeIn, ...options }),
    
    slideUp: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.slideUp, ...options }),
    
    slideInLeft: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.slideInLeft, ...options }),
    
    slideInRight: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.slideInRight, ...options }),
    
    scaleIn: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.scaleIn, ...options }),
    
    bounceIn: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.bounceIn, ...options }),

    // Animaciones especiales
    heroTextReveal: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.heroTextReveal, ...options }),
    
    staggerFadeIn: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.staggerFadeIn, ...options }),
    
    typeWriter: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.typeWriter, ...options }),

    // Animaciones de loop
    spin: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.spin, ...options }),
    
    pulse: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.pulse, ...options }),
    
    float: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.float, ...options }),

    // Animaciones de interacción
    cardHover: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.cardHover, ...options }),
    
    modalEnter: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.modalEnter, ...options }),

    // Animaciones de salida
    fadeOut: (targets: string | HTMLElement, options?: Partial<AnimeConfig>) =>
      createAnimation({ targets, ...animePresets.fadeOut, ...options }),

    // Estado
    isLoaded,
  }
}

// HOOK PARA ANIMACIONES EN INTERSECCIÓN (scroll)
export function useScrollAnimation() {
  const { createAnimation, isLoaded } = useAnime()

  useEffect(() => {
    if (!isLoaded) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement
            const animationType = element.dataset.anime
            const delay = parseInt(element.dataset.animeDelay || '0')

            if (animationType) {
              const preset = animePresets[animationType as keyof typeof animePresets]
              if (preset) {
                createAnimation({
                  targets: element,
                  ...preset,
                  delay,
                })
              }
            }
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px',
      }
    )

    // Observar elementos con data-anime
    const elements = document.querySelectorAll('[data-anime]')
    elements.forEach((el) => observer.observe(el))

    return () => {
      elements.forEach((el) => observer.unobserve(el))
    }
  }, [isLoaded, createAnimation])

  return { isLoaded }
}

// COMPONENTE WRAPPER PARA ANIMACIONES
interface AnimatedElementProps {
  children: ReactNode
  animation: keyof typeof animePresets
  delay?: number
  trigger?: 'immediate' | 'scroll' | 'hover'
  className?: string
  style?: React.CSSProperties
}

export function AnimatedElement({
  children,
  animation,
  delay = 0,
  trigger = 'scroll',
  className = '',
  style = {},
}: AnimatedElementProps) {
  const { createAnimation, isLoaded } = useAnime()
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isLoaded || !elementRef) return

    if (trigger === 'immediate') {
      const preset = animePresets[animation]
      createAnimation({
        targets: elementRef,
        ...preset,
        delay,
      })
    }
  }, [isLoaded, elementRef, animation, delay, trigger, createAnimation])

  const handleRef = useCallback((node: HTMLDivElement) => {
    setElementRef(node)
  }, [])

  return (
    <div
      ref={handleRef}
      className={className}
      style={style}
      data-anime={trigger === 'scroll' ? animation : undefined}
      data-anime-delay={trigger === 'scroll' ? delay.toString() : undefined}
    >
      {children}
    </div>
  )
}