import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';

interface PdfParseResult {
  text: string;
  numpages: number;
  numrender: number;
  info: any;
  metadata: any;
}

type PdfParseFunction = (buffer: Buffer) => Promise<PdfParseResult>;

@Injectable()
export class PdfExtractService {
  private readonly logger = new Logger(PdfExtractService.name);
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      // Valida tamanho do arquivo
      if (buffer.length > this.maxFileSize) {
        throw new HttpException(
          `Arquivo muito grande. Tamanho máximo: ${this.maxFileSize / 1024 / 1024}MB`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Valida se é PDF
      if (!this.isPdf(buffer)) {
        throw new HttpException(
          'Arquivo não é um PDF válido',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(
        `Extraindo texto de PDF (${(buffer.length / 1024).toFixed(2)}KB)`,
      );

      // Extrai texto do PDF usando require (versão 1.1.1 exporta função diretamente)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParseModule: unknown = require('pdf-parse');

      // pdf-parse v1.1.1 exporta uma função diretamente
      let pdfParse: PdfParseFunction | null = null;

      if (typeof pdfParseModule === 'function') {
        pdfParse = pdfParseModule as PdfParseFunction;
      } else if (
        typeof pdfParseModule === 'object' &&
        pdfParseModule !== null &&
        'default' in pdfParseModule &&
        typeof (pdfParseModule as { default?: unknown }).default === 'function'
      ) {
        pdfParse = (pdfParseModule as { default: PdfParseFunction }).default;
      }

      if (!pdfParse) {
        this.logger.error(
          `Erro ao carregar pdf-parse. Tipo: ${typeof pdfParseModule}`,
        );
        throw new HttpException(
          'Erro ao carregar biblioteca de parsing de PDF',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const data = await pdfParse(buffer);
      const text = data.text.trim();

      if (!text || text.length < 50) {
        throw new HttpException(
          'PDF não contém texto suficiente para análise (mínimo 50 caracteres)',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Texto extraído com sucesso (${text.length} caracteres)`);
      return text;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao extrair texto do PDF: ${errorMessage}`);
      throw new HttpException(
        'Erro ao processar PDF. Verifique se o arquivo está válido e contém texto.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private isPdf(buffer: Buffer): boolean {
    // Verifica o header do PDF (deve começar com %PDF)
    const header = buffer.toString('ascii', 0, 4);
    return header === '%PDF';
  }
}
