import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Translations {
  [key: string]: any;
}

@Injectable()
export class SimpleI18nService {
  private translations: Map<string, Translations> = new Map();
  private currentLanguage = 'en';

  constructor() {
    this.loadTranslations();
  }

  private loadTranslations() {
    try {
      // Cargar traducciones inglés
      const enAuth = JSON.parse(readFileSync(join(process.cwd(), 'src/i18n/en/auth.json'), 'utf8'));
      const enCommon = JSON.parse(readFileSync(join(process.cwd(), 'src/i18n/en/common.json'), 'utf8'));
      const enValidation = JSON.parse(readFileSync(join(process.cwd(), 'src/i18n/en/validation.json'), 'utf8'));
      
      this.translations.set('en', {
        auth: enAuth,
        common: enCommon,
        validation: enValidation,
      });

      // Cargar traducciones español
      const esAuth = JSON.parse(readFileSync(join(process.cwd(), 'src/i18n/es/auth.json'), 'utf8'));
      const esCommon = JSON.parse(readFileSync(join(process.cwd(), 'src/i18n/es/common.json'), 'utf8'));
      const esValidation = JSON.parse(readFileSync(join(process.cwd(), 'src/i18n/es/validation.json'), 'utf8'));
      
      this.translations.set('es', {
        auth: esAuth,
        common: esCommon,
        validation: esValidation,
      });
    } catch (error) {
      console.warn('Error loading translations, using defaults:', error.message);
      this.loadDefaultTranslations();
    }
  }

  private loadDefaultTranslations() {
    // Traducciones por defecto en caso de error
    this.translations.set('en', {
      auth: {
        login: { success: 'Login successful' },
        logout: { success: 'Logout successful' },
        register: { success: 'Registration successful' },
        changePassword: { success: 'Password changed successfully' },
        forgotPassword: { success: 'Reset instructions sent' },
        resetPassword: { success: 'Password reset successful' },
        verification: { success: 'Email verified successfully' },
      },
      common: {
        actions: { save: 'Save', cancel: 'Cancel' },
        status: { active: 'Active', inactive: 'Inactive' },
      },
      validation: { required: 'This field is required' },
    });

    this.translations.set('es', {
      auth: {
        login: { success: 'Inicio de sesión exitoso' },
        logout: { success: 'Sesión cerrada exitosamente' },
        register: { success: 'Registro exitoso' },
        changePassword: { success: 'Contraseña cambiada exitosamente' },
        forgotPassword: { success: 'Instrucciones enviadas' },
        resetPassword: { success: 'Contraseña restablecida exitosamente' },
        verification: { success: 'Email verificado exitosamente' },
      },
      common: {
        actions: { save: 'Guardar', cancel: 'Cancelar' },
        status: { active: 'Activo', inactive: 'Inactivo' },
      },
      validation: { required: 'Este campo es obligatorio' },
    });
  }

  setLanguage(lang: string) {
    if (this.translations.has(lang)) {
      this.currentLanguage = lang;
    }
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  t(key: string, lang?: string, options?: any): string {
    const language = lang || this.currentLanguage;
    const translations = this.translations.get(language) || this.translations.get('en');
    
    if (!translations) {
      return key;
    }

    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Retornar la key si no se encuentra la traducción
      }
    }

    // Reemplazar variables si existen
    if (typeof value === 'string' && options?.args) {
      return this.replaceVariables(value, options.args);
    }

    return typeof value === 'string' ? value : key;
  }

  private replaceVariables(text: string, args: any): string {
    return text.replace(/{(\w+)}/g, (match, key) => {
      return args[key] !== undefined ? args[key] : match;
    });
  }

  // Métodos de conveniencia
  translateStatus(status: string, lang?: string): string {
    return this.t(`common.status.${status.toLowerCase()}`, lang);
  }

  translateCategory(category: string, lang?: string): string {
    return this.t(`products.categories.${category}`, lang);
  }

  translateDifficulty(difficulty: string, lang?: string): string {
    return this.t(`products.difficulty.${difficulty}`, lang);
  }

  formatPrice(amount: number, lang?: string): string {
    const language = lang || this.currentLanguage;
    
    if (amount === 0) {
      return this.t('common.currency.free', language);
    }

    const symbol = this.t('common.currency.symbol', language);
    
    if (language === 'es') {
      return `${symbol}${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
    } else {
      return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
  }

  getAvailableLanguages(): Array<{ code: string; name: string; nativeName: string }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
    ];
  }

  detectPreferredLanguage(acceptLanguageHeader?: string): string {
    if (!acceptLanguageHeader) return 'en';

    const languages = acceptLanguageHeader
      .split(',')
      .map(lang => {
        const [code, quality = '1'] = lang.trim().split(';q=');
        return { code: code.split('-')[0], quality: parseFloat(quality) };
      })
      .sort((a, b) => b.quality - a.quality);

    for (const lang of languages) {
      if (['en', 'es'].includes(lang.code)) {
        return lang.code;
      }
    }

    return 'en';
  }
}