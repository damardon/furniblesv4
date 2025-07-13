import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';
 
export default getRequestConfig(async () => {
  // Obtener idioma de las cookies o usar 'es' por defecto
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'es';
 
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});