import { Module } from '@nestjs/common';
import { I18nModule, AcceptLanguageResolver, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, './'),
        watch: false, // Simplificado
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
      throwOnMissingKey: false,
    }),
  ],
  exports: [I18nModule],
})
export class I18nConfigModule {}