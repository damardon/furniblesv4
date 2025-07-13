// Declaración de tipos para particles.js
declare module 'particles.js' {
  interface ParticlesConfig {
    particles: {
      number: {
        value: number;
        density: {
          enable: boolean;
          value_area: number;
        };
      };
      color: {
        value: string | string[];
      };
      shape: {
        type: string | string[];
      };
      opacity: {
        value: number;
        random: boolean;
      };
      size: {
        value: number;
        random: boolean;
      };
      line_linked: {
        enable: boolean;
        distance: number;
        color: string;
        opacity: number;
        width: number;
      };
      move: {
        enable: boolean;
        speed: number;
        direction: string;
        random: boolean;
        straight: boolean;
        out_mode: string;
        bounce: boolean;
      };
    };
    interactivity: {
      detect_on: string;
      events: {
        onhover: {
          enable: boolean;
          mode: string;
        };
        onclick: {
          enable: boolean;
          mode: string;
        };
        resize: boolean;
      };
    };
    retina_detect: boolean;
  }

  function particlesJS(tag_id: string, config: ParticlesConfig): void;
  
  // Variables globales
  namespace particlesJS {
    let fn: {
      vendors: {
        destroypJS(): void;
      };
    };
  }

  // Window extensions
  declare global {
    interface Window {
      pJSDom: Array<{
        pJS: {
          fn: {
            vendors: {
              destroypJS(): void;
            };
          };
        };
      }>;
      particlesJS: typeof particlesJS;
    }
  }

  export = particlesJS;
}