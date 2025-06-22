import { Module, Global } from '@nestjs/common';
import { SimpleI18nService } from './simple-i18n.service';

@Global()
@Module({
  providers: [SimpleI18nService],
  exports: [SimpleI18nService],
})
export class I18nModule {}