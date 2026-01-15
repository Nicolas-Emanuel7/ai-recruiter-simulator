import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslateService } from '../services/translate.service';
import { Subscription, combineLatest } from 'rxjs';

@Pipe({
  name: 'translate',
  pure: false, // Não é puro para reagir a mudanças de idioma
  standalone: true,
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private lastKey: string = '';
  private lastValue: string = '';
  private subscription?: Subscription;

  constructor(
    private translate: TranslateService,
    private changeDetector: ChangeDetectorRef
  ) {
    // Observa mudanças de idioma e estado de loading
    this.subscription = combineLatest([
      this.translate.currentLang,
      this.translate.isLoading
    ]).subscribe(() => {
      this.lastKey = ''; // Força recálculo quando idioma ou loading mudar
      this.changeDetector.markForCheck();
    });
  }

  transform(key: string, params?: { [key: string]: any }): string {
    if (!key) {
      return '';
    }

    // Sempre recalcula para garantir que pega a tradução atualizada
    const translation = this.translate.instant(key, params);
    
    // Atualiza o cache
    this.lastKey = key;
    this.lastValue = translation;
    
    return translation;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
