import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { SimulateService } from '../../services/simulate.service';
import { SimulateResponse } from '../../models/simulate.models';
import { TranslateService } from '../../services/translate.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-simulate',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './simulate.component.html',
  styleUrl: './simulate.component.scss',
})
export class SimulateComponent implements OnInit {
  simulateForm!: FormGroup;
  resumeInputMethod: 'text' | 'pdf' = 'text';
  selectedFile: File | null = null;
  fileName: string = '';
  isLoading: boolean = false;
  isLoadingTranslations: boolean = true;
  result: SimulateResponse | null = null;
  error: string | null = null;
  currentLanguage: string = 'pt-br';

  experienceLevels: { value: 'Júnior' | 'Pleno' | 'Sênior'; label: string }[] =
    [
      { value: 'Júnior', label: 'Júnior' },
      { value: 'Pleno', label: 'Pleno' },
      { value: 'Sênior', label: 'Sênior' },
    ];

  languages = [
    { code: 'pt-br', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];
  open = false;

  constructor(
    private fb: FormBuilder,
    private simulateService: SimulateService,
    private translate: TranslateService
  ) {
    // Carrega o idioma do localStorage ou usa pt-br como padrão
    const savedLang = localStorage.getItem('language');
    this.currentLanguage =
      savedLang && (savedLang === 'pt-br' || savedLang === 'en')
        ? savedLang
        : 'pt-br';
  }

  ngOnInit(): void {
    this.initForm();

    // Subscribe to loading state first
    this.translate.isLoading.subscribe((loading) => {
      this.isLoadingTranslations = loading;
    });

    // Initialize language from localStorage or default to pt-br
    const savedLang = localStorage.getItem('language');
    const langToUse =
      savedLang && (savedLang === 'pt-br' || savedLang === 'en')
        ? savedLang
        : 'pt-br';

    if (!savedLang || (savedLang !== 'pt-br' && savedLang !== 'en')) {
      localStorage.setItem('language', 'pt-br');
    }

    this.currentLanguage = langToUse;

    // Check if translations are already loaded
    const currentTranslations = this.translate.getTranslations();
    if (Object.keys(currentTranslations).length > 0) {
      // Already loaded, just update
      this.isLoadingTranslations = false;
      this.updateExperienceLevels();
      // Force change detection to update the view
      setTimeout(() => {
        this.updateExperienceLevels();
      }, 0);
    } else {
      // Load translations
      this.translate.use(langToUse).subscribe({
        next: (translations) => {
          console.log(
            '✅ [Translate] Translations loaded:',
            Object.keys(translations).length,
            'keys'
          );
          this.updateExperienceLevels();
          // Force change detection after a small delay to ensure pipe updates
          setTimeout(() => {
            this.updateExperienceLevels();
          }, 100);
        },
        error: (err) => {
          console.error('❌ [Translate] Error loading translations:', err);
          // Fallback to default
          this.translate.use('pt-br').subscribe(() => {
            this.updateExperienceLevels();
          });
        },
      });
    }

    // Subscribe to language changes
    this.translate.currentLang.subscribe((lang) => {
      console.log('🔄 [Translate] Language changed to:', lang);
      this.currentLanguage = lang;
      this.updateExperienceLevels();
    });
  }

  switchLanguage(lang: string): void {
    this.currentLanguage = lang;
    this.translate.use(lang).subscribe({
      next: () => {
        this.updateExperienceLevels();
      },
      error: (err) => {
        console.error('❌ [Translate] Error switching language:', err);
        this.isLoadingTranslations = false;
      },
    });
  }

  private updateExperienceLevels(): void {
    const translations = this.translate.getTranslations();
    const levels = translations['form']?.['experienceLevels'] || {};

    this.experienceLevels = [
      { value: 'Júnior', label: levels['junior'] || 'Júnior' },
      { value: 'Pleno', label: levels['pleno'] || 'Pleno' },
      { value: 'Sênior', label: levels['senior'] || 'Sênior' },
    ];
  }

  initForm(): void {
    this.simulateForm = this.fb.group({
      jobTitle: ['', [Validators.required, Validators.minLength(3)]],
      jobDescription: [''],
      experienceLevel: ['Pleno', Validators.required],
      resumeText: ['', Validators.required],
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.type !== 'application/pdf') {
        this.translate.get('errors.invalidPdf').subscribe((msg) => {
          this.error = msg;
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        this.translate.get('errors.fileTooLarge').subscribe((msg) => {
          this.error = msg;
        });
        return;
      }

      this.selectedFile = file;
      this.fileName = file.name;
      this.error = null;
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileName = '';
    const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  switchInputMethod(method: 'text' | 'pdf'): void {
    this.resumeInputMethod = method;
    this.selectedFile = null;
    this.fileName = '';
    this.error = null;

    if (method === 'text') {
      this.simulateForm.get('resumeText')?.setValidators([Validators.required]);
    } else {
      this.simulateForm.get('resumeText')?.clearValidators();
    }
    this.simulateForm.get('resumeText')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.simulateForm.invalid) {
      this.markFormGroupTouched(this.simulateForm);
      return;
    }

    if (this.resumeInputMethod === 'pdf' && !this.selectedFile) {
      this.translate.get('errors.pdfRequired').subscribe((msg) => {
        this.error = msg;
      });
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.result = null;

    const formValue = this.simulateForm.value;

    const language = this.currentLanguage as 'pt-br' | 'en';

    const request$ =
      this.resumeInputMethod === 'pdf'
        ? this.simulateService.simulateWithPdf(
            this.selectedFile!,
            formValue.jobTitle,
            formValue.jobDescription || undefined,
            formValue.experienceLevel,
            language
          )
        : this.simulateService.simulate({
            jobTitle: formValue.jobTitle,
            jobDescription: formValue.jobDescription || undefined,
            experienceLevel: formValue.experienceLevel,
            resumeText: formValue.resumeText,
            language,
          });

    request$.subscribe({
      next: (response) => {
        this.result = response;
        this.isLoading = false;
        // Scroll para o resultado
        setTimeout(() => {
          const resultElement = document.getElementById('result-section');
          if (resultElement) {
            resultElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }, 100);
      },
      error: (err) => {
        if (err.error?.message) {
          this.error = err.error.message;
        } else {
          this.translate.get('errors.processingError').subscribe((msg) => {
            this.error = msg;
          });
        }
        this.isLoading = false;
      },
    });
  }

  resetForm(): void {
    this.simulateForm.reset({
      experienceLevel: 'Pleno',
    });
    this.selectedFile = null;
    this.fileName = '';
    this.result = null;
    this.error = null;
    this.resumeInputMethod = 'text';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getDecisionColor(decision: string): string {
    const normalizedDecision = decision.toUpperCase();
    switch (normalizedDecision) {
      case 'AVANÇA':
      case 'PASS':
        return 'success';
      case 'TALVEZ':
      case 'MAYBE':
        return 'warning';
      case 'REPROVA':
      case 'REJECT':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  translateDecision(decision: string): string {
    const normalizedDecision = decision.toUpperCase();
    // Try to translate, but if not found, return original
    const translation = this.translate.instant(
      `decisions.${normalizedDecision}`
    );
    return translation && translation !== `decisions.${normalizedDecision}`
      ? translation
      : decision;
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  }
}
