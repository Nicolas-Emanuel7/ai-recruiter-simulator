import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface TranslationObject {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class TranslateService {
  private translations: { [lang: string]: TranslationObject } = {};
  private currentLang$ = new BehaviorSubject<string>('pt-br');
  private isLoading$ = new BehaviorSubject<boolean>(true);
  public currentLang = this.currentLang$.asObservable();
  public isLoading = this.isLoading$.asObservable();

  constructor(private http: HttpClient) {
    const savedLang = localStorage.getItem('language') || 'pt-br';
    this.currentLang$.next(savedLang);
    this.isLoading$.next(true);
    this.loadLanguage(savedLang).subscribe({
      next: () => {
        this.isLoading$.next(false);
      },
      error: () => {
        this.isLoading$.next(false);
      },
    });
  }

  /**
   * Carrega as traduções de um idioma
   */
  loadLanguage(lang: string): Observable<TranslationObject> {
    // Se já carregou, retorna imediatamente e não marca como loading
    if (this.translations[lang]) {
      this.isLoading$.next(false);
      return of(this.translations[lang]);
    }

    console.log(`🔄 [TranslateService] Loading language: ${lang}`);
    const url = `/assets/i18n/${lang}.json`;

    return this.http.get<TranslationObject>(url).pipe(
      tap((translations) => {
        console.log(`✅ [TranslateService] Loaded translations for ${lang}:`, translations);
        this.translations[lang] = translations;
      }),
      catchError((error) => {
        console.error(`❌ [TranslateService] Error loading ${lang}:`, error);
        // Retorna objeto vazio em caso de erro
        this.translations[lang] = {};
        return of({});
      })
    );
  }

  /**
   * Troca o idioma atual
   */
  use(lang: string): Observable<TranslationObject> {
    console.log(`🔄 [TranslateService] Switching to language: ${lang}`);
    localStorage.setItem('language', lang);
    this.currentLang$.next(lang);
    this.isLoading$.next(true);
    return this.loadLanguage(lang).pipe(
      tap(() => {
        this.isLoading$.next(false);
      }),
      catchError((error) => {
        this.isLoading$.next(false);
        throw error;
      })
    );
  }

  /**
   * Obtém uma tradução (síncrono - retorna a chave se não encontrar)
   */
  instant(key: string, params?: { [key: string]: any }): string {
    const lang = this.currentLang$.value;
    const translation = this.getTranslation(key, lang);

    if (params) {
      return this.interpolate(translation, params);
    }

    return translation;
  }

  /**
   * Obtém uma tradução (assíncrono)
   */
  get(key: string, params?: { [key: string]: any }): Observable<string> {
    const lang = this.currentLang$.value;

    if (this.translations[lang]) {
      const translation = this.getTranslation(key, lang);
      const result = params ? this.interpolate(translation, params) : translation;
      return of(result);
    }

    // Se não carregou ainda, carrega primeiro
    return this.loadLanguage(lang).pipe(
      map(() => {
        const translation = this.getTranslation(key, lang);
        return params ? this.interpolate(translation, params) : translation;
      })
    );
  }

  /**
   * Obtém o objeto de traduções completo
   */
  getTranslations(lang?: string): TranslationObject {
    const targetLang = lang || this.currentLang$.value;
    return this.translations[targetLang] || {};
  }

  /**
   * Obtém o idioma atual
   */
  getCurrentLang(): string {
    return this.currentLang$.value;
  }

  /**
   * Define o idioma padrão
   */
  setDefaultLang(lang: string): void {
    this.loadLanguage(lang).subscribe();
  }

  /**
   * Obtém uma tradução do objeto de traduções
   */
  private getTranslation(key: string, lang: string): string {
    const translations = this.translations[lang];
    if (!translations) {
      return key;
    }

    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  /**
   * Interpola parâmetros na tradução
   */
  private interpolate(translation: string, params: { [key: string]: any }): string {
    let result = translation;
    for (const key in params) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), params[key]);
    }
    return result;
  }
}
