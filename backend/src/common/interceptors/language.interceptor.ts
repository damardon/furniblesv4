import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  constructor(private readonly i18n: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Detectar idioma por:
    // 1. Query parameter: ?lang=es
    // 2. Header: x-lang
    // 3. Accept-Language header
    // 4. Usuario autenticado (preferencia guardada)
    
    let language = request.query.lang || 
                  request.headers['x-lang'] || 
                  request.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
                  'en';

    // Validar que el idioma esté soportado
    const supportedLanguages = ['en', 'es'];
    if (!supportedLanguages.includes(language)) {
      language = 'en';
    }

    // Establecer el idioma en el contexto
    request.i18nLang = language;
    
    return next.handle();
  }
}