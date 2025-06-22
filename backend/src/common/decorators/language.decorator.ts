import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

export const Language = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const i18nContext = I18nContext.current(ctx);
    return i18nContext?.lang || 'en';
  },
);