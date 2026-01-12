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

@Component({
  selector: 'app-simulate',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './simulate.component.html',
  styleUrl: './simulate.component.scss',
})
export class SimulateComponent implements OnInit {
  simulateForm!: FormGroup;
  resumeInputMethod: 'text' | 'pdf' = 'text';
  selectedFile: File | null = null;
  fileName: string = '';
  isLoading: boolean = false;
  result: SimulateResponse | null = null;
  error: string | null = null;

  experienceLevels: { value: 'Júnior' | 'Pleno' | 'Sênior'; label: string }[] =
    [
      { value: 'Júnior', label: 'Júnior' },
      { value: 'Pleno', label: 'Pleno' },
      { value: 'Sênior', label: 'Sênior' },
    ];

  constructor(
    private fb: FormBuilder,
    private simulateService: SimulateService
  ) {}

  ngOnInit(): void {
    this.initForm();
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
        this.error = 'Por favor, selecione um arquivo PDF válido.';
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        this.error = 'O arquivo é muito grande. Tamanho máximo: 10MB.';
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
      this.error = 'Por favor, selecione um arquivo PDF.';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.result = null;

    const formValue = this.simulateForm.value;

    const request$ =
      this.resumeInputMethod === 'pdf'
        ? this.simulateService.simulateWithPdf(
            this.selectedFile!,
            formValue.jobTitle,
            formValue.jobDescription || undefined,
            formValue.experienceLevel
          )
        : this.simulateService.simulate({
            jobTitle: formValue.jobTitle,
            jobDescription: formValue.jobDescription || undefined,
            experienceLevel: formValue.experienceLevel,
            resumeText: formValue.resumeText,
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
        this.error =
          err.error?.message || 'Erro ao processar simulação. Tente novamente.';
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
    switch (decision) {
      case 'AVANÇA':
        return 'success';
      case 'TALVEZ':
        return 'warning';
      case 'REPROVA':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  }
}
