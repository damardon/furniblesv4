'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useTheme } from 'next-themes'
import { ParticlesConfig } from '@/types/additional'
import * as React from 'react'


// PARTICLES CONTEXT TYPE
interface ParticlesContextType {
  isEnabled: boolean
  isLoaded: boolean
  config: ParticlesConfig | null
  toggleParticles: () => void
  updateConfig: (config: Partial<ParticlesConfig>) => void
  destroyParticles: () => void
  initParticles: (elementId?: string) => void
}

// PARTICLES CONTEXT
const ParticlesContext = createContext<ParticlesContextType>({
  isEnabled: false,
  isLoaded: false,
  config: null,
  toggleParticles: () => {},
  updateConfig: () => {},
  destroyParticles: () => {},
  initParticles: () => {},
})

// PARTICLES PROVIDER PROPS
interface ParticlesProviderProps {
  children: ReactNode
}

// CONFIGURACIONES POR DEFECTO
const defaultLightConfig: ParticlesConfig = {
  particles: {
    number: {
      value: 80,
      density: {
        enable: true,
        value_area: 800,
      },
    },
    color: {
      value: '#d17943', // Furnibles wood color
    },
    shape: {
      type: 'circle',
    },
    opacity: {
      value: 0.5,
      random: false,
    },
    size: {
      value: 3,
      random: true,
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: '#d17943',
      opacity: 0.4,
      width: 1,
    },
    move: {
      enable: true,
      speed: 6,
      direction: 'none',
      random: false,
      straight: false,
      out_mode: 'out',
      bounce: false,
    },
  },
  interactivity: {
    detect_on: 'canvas',
    events: {
      onhover: {
        enable: true,
        mode: 'repulse',
      },
      onclick: {
        enable: true,
        mode: 'push',
      },
      resize: true,
    },
  },
  retina_detect: true,
}

const defaultDarkConfig: ParticlesConfig = {
  ...defaultLightConfig,
  particles: {
    ...defaultLightConfig.particles,
    color: {
      value: '#a3512f', // Darker wood color for dark mode
    },
    line_linked: {
      ...defaultLightConfig.particles.line_linked,
      color: '#a3512f',
    },
  },
}

// CONFIGURACIONES ESPECIALES
export const particleConfigs = {
  hero: {
    light: {
      ...defaultLightConfig,
      particles: {
        ...defaultLightConfig.particles,
        number: {
          value: 100,
          density: {
            enable: true,
            value_area: 1000,
          },
        },
        color: {
          value: ['#d17943', '#359360', '#ffad2b'], // Furnibles palette
        },
        shape: {
          type: ['circle', 'triangle'],
        },
        size: {
          value: 4,
          random: true,
        },
        move: {
          enable: true,
          speed: 2,
          direction: 'none',
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false,
        },
      },
    },
    dark: {
      ...defaultDarkConfig,
      particles: {
        ...defaultDarkConfig.particles,
        number: {
          value: 60,
          density: {
            enable: true,
            value_area: 1000,
          },
        },
        color: {
          value: ['#a3512f', '#205e3e', '#cc7310'],
        },
      },
    },
  },
  
  minimal: {
    light: {
      ...defaultLightConfig,
      particles: {
        ...defaultLightConfig.particles,
        number: {
          value: 30,
          density: {
            enable: true,
            value_area: 800,
          },
        },
        opacity: {
          value: 0.3,
          random: false,
        },
        size: {
          value: 2,
          random: true,
        },
        line_linked: {
          enable: false,
          distance: 0,
          color: '',
          opacity: 0,
          width: 0,
        },
        move: {
          enable: true,
          speed: 1,
          direction: 'none',
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false,
        },
      },
    },
    dark: {
      ...defaultDarkConfig,
      particles: {
        ...defaultDarkConfig.particles,
        number: {
          value: 20,
          density: {
            enable: true,
            value_area: 800,
          },
        },
        opacity: {
          value: 0.2,
          random: false,
        },
        line_linked: {
          enable: false,
          distance: 0,
          color: '',
          opacity: 0,
          width: 0,
        },
      },
    },
  },

  floating: {
    light: {
      ...defaultLightConfig,
      particles: {
        ...defaultLightConfig.particles,
        number: {
          value: 15,
          density: {
            enable: false,
            value_area: 800,
          },
        },
        color: {
          value: '#ffad2b', // Gold particles
        },
        shape: {
          type: 'circle',
        },
        opacity: {
          value: 0.6,
          random: true,
        },
        size: {
          value: 8,
          random: true,
        },
        line_linked: {
          enable: false,
          distance: 0,
          color: '',
          opacity: 0,
          width: 0,
        },
        move: {
          enable: true,
          speed: 0.5,
          direction: 'top',
          random: false,
          straight: false,
          out_mode: 'out',
          bounce: false,
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: {
            enable: false,
            mode: 'repulse',
          },
          onclick: {
            enable: false,
            mode: 'push',
          },
          resize: true,
        },
      },
    },
    dark: {
      ...defaultDarkConfig,
      particles: {
        ...defaultDarkConfig.particles,
        number: {
          value: 10,
          density: {
            enable: false,
            value_area: 800,
          },
        },
        color: {
          value: '#cc7310',
        },
        opacity: {
          value: 0.4,
          random: true,
        },
        line_linked: {
          enable: false,
          distance: 0,
          color: '',
          opacity: 0,
          width: 0,
        },
      },
    },
  },
}

export function ParticlesProvider({ children }: ParticlesProviderProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [config, setConfig] = useState<ParticlesConfig | null>(null)
  const [particlesJS, setParticlesJS] = useState<any>(null)
  
  const { theme, systemTheme } = useTheme()

  // Determinar tema actual
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'

  // Cargar particles.js
  useEffect(() => {
    const loadParticles = async () => {
      try {
        // Importar particles.js dinámicamente
        const particles = await import('particles.js')
        setParticlesJS(particles)
        setIsLoaded(true)
        
        // Verificar si las partículas están habilitadas por variable de entorno
        const enableParticles = process.env.NEXT_PUBLIC_ENABLE_PARTICLES === 'true'
        setIsEnabled(enableParticles)
        
        // Configurar configuración inicial
        const initialConfig = isDark ? defaultDarkConfig : defaultLightConfig
        setConfig(initialConfig)
        
        console.log('✨ Particles.js cargado exitosamente')
      } catch (error) {
        console.error('❌ Error cargando particles.js:', error)
      }
    }

    loadParticles()
  }, [isDark])

  // Actualizar configuración cuando cambie el tema
  useEffect(() => {
    if (isLoaded && config) {
      const newConfig = isDark ? defaultDarkConfig : defaultLightConfig
      setConfig(newConfig)
      
      // Reinicializar si las partículas están activas
      if (isEnabled) {
        destroyParticles()
        setTimeout(() => initParticles(), 100)
      }
    }
  }, [isDark, isLoaded])

  // Inicializar partículas
  const initParticles = (elementId = 'particles-js') => {
    if (!particlesJS || !config || !isEnabled) return

    const element = document.getElementById(elementId)
    if (!element) {
      console.warn(`Elemento ${elementId} no encontrado para particles`)
      return
    }

    try {
      // Limpiar partículas existentes
      element.innerHTML = ''
      
      // Inicializar nuevas partículas
      particlesJS(elementId, config)
      console.log('✨ Partículas inicializadas en:', elementId)
    } catch (error) {
      console.error('❌ Error inicializando partículas:', error)
    }
  }

  // Destruir partículas
  const destroyParticles = () => {
    if (!particlesJS) return

    try {
      // Limpiar todas las instancias de partículas
      if (window.pJSDom && window.pJSDom.length > 0) {
        window.pJSDom.forEach((pJS: any) => {
          if (pJS.pJS) {
            pJS.pJS.fn.vendors.destroypJS()
          }
        })
        window.pJSDom = []
      }
      
      console.log('🧹 Partículas destruidas')
    } catch (error) {
      console.error('❌ Error destruyendo partículas:', error)
    }
  }

  // Toggle partículas
  const toggleParticles = () => {
    const newEnabled = !isEnabled
    setIsEnabled(newEnabled)
    
    if (newEnabled) {
      initParticles()
    } else {
      destroyParticles()
    }
    
    // Guardar preferencia en localStorage
    localStorage.setItem('furnibles-particles-enabled', newEnabled.toString())
  }

  // Actualizar configuración
  const updateConfig = (newConfig: Partial<ParticlesConfig>) => {
    if (!config) return
    
    const updatedConfig = {
      ...config,
      ...newConfig,
      particles: {
        ...config.particles,
        ...newConfig.particles,
      },
    }
    
    setConfig(updatedConfig)
    
    // Reinicializar si están activas
    if (isEnabled) {
      destroyParticles()
      setTimeout(() => initParticles(), 100)
    }
  }

  // Cargar preferencia guardada
  useEffect(() => {
    const savedPreference = localStorage.getItem('furnibles-particles-enabled')
    if (savedPreference !== null) {
      setIsEnabled(savedPreference === 'true')
    }
  }, [])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      destroyParticles()
    }
  }, [])

  const contextValue: ParticlesContextType = {
    isEnabled,
    isLoaded,
    config,
    toggleParticles,
    updateConfig,
    destroyParticles,
    initParticles,
  }

  return (
    <ParticlesContext.Provider value={contextValue}>
      {children}
    </ParticlesContext.Provider>
  )
}

// HOOK PARA USAR PARTICLES
export function useParticles() {
  const context = useContext(ParticlesContext)
  if (!context) {
    throw new Error('useParticles debe ser usado dentro de ParticlesProvider')
  }
  return context
}

// HOOK PARA CONFIGURACIONES PREDEFINIDAS
export function useParticleConfigs() {
  const { updateConfig } = useParticles()
  const { theme, systemTheme } = useTheme()
  
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'

  return {
    applyHeroConfig: () => {
      const config = isDark ? particleConfigs.hero.dark : particleConfigs.hero.light
      updateConfig(config)
    },
    
    applyMinimalConfig: () => {
      const config = isDark ? particleConfigs.minimal.dark : particleConfigs.minimal.light
      updateConfig(config)
    },
    
    applyFloatingConfig: () => {
      const config = isDark ? particleConfigs.floating.dark : particleConfigs.floating.light
      updateConfig(config)
    },
    
    applyCustomConfig: (customConfig: ParticlesConfig) => {
      updateConfig(customConfig)
    },
  }
}

// COMPONENTE PARTICLES WRAPPER
interface ParticlesWrapperProps {
  id?: string
  className?: string
  config?: 'hero' | 'minimal' | 'floating' | 'default'
  autoInit?: boolean
}

export function ParticlesWrapper({ 
  id = 'particles-js', 
  className = '', 
  config = 'default',
  autoInit = true 
}: ParticlesWrapperProps) {
  const { isEnabled, isLoaded, initParticles } = useParticles()
  const { applyHeroConfig, applyMinimalConfig, applyFloatingConfig } = useParticleConfigs()

  useEffect(() => {
    if (isLoaded && isEnabled && autoInit) {
      // Aplicar configuración específica
      switch (config) {
        case 'hero':
          applyHeroConfig()
          break
        case 'minimal':
          applyMinimalConfig()
          break
        case 'floating':
          applyFloatingConfig()
          break
        default:
          break
      }
      
      // Inicializar con delay para permitir que se aplique la configuración
      setTimeout(() => initParticles(id), 200)
    }
  }, [isLoaded, isEnabled, autoInit, config, id])

  if (!isEnabled) return null

  return (
    <div 
      id={id}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
    />
  )
}

