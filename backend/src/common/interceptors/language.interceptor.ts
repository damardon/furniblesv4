import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Obtener idioma del contexto i18n
    const i18nContext = I18nContext.current();
    const language = i18nContext?.lang || 'en';
    
    // Establecer header de respuesta con el idioma detectado
    response.setHeader('Content-Language', language);
    
    // Agregar idioma al request para uso posterior
    request.language = language;
    
    return next.handle();
  }
}