import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { SimulateService } from './simulate.service';
import { PdfExtractService } from './pdf-extract.service';
import { SimulateRequestDto, SimulateResponseDto } from './simulate.dto';

@ApiTags('simulate')
@Controller('simulate')
export class SimulateController {
  constructor(
    private readonly simulateService: SimulateService,
    private readonly pdfExtractService: PdfExtractService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simula triagem de currículo',
    description:
      'Analisa um currículo para uma vaga específica usando IA, simulando ATS, recrutador técnico e RH',
  })
  @ApiResponse({
    status: 200,
    description: 'Análise do currículo realizada com sucesso',
    type: SimulateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: 502,
    description: 'Erro na comunicação com a API de LLM',
  })
  async simulate(
    @Body() request: SimulateRequestDto,
  ): Promise<SimulateResponseDto> {
    return this.simulateService.simulate(request);
  }

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('resume'))
  @ApiOperation({
    summary: 'Simula triagem de currículo via upload de PDF',
    description:
      'Faz upload de um PDF de currículo e analisa para uma vaga específica',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        resume: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo PDF do currículo',
        },
        jobTitle: {
          type: 'string',
          description: 'Título da vaga',
          example: 'Frontend Developer',
        },
        jobDescription: {
          type: 'string',
          description: 'Descrição da vaga (opcional)',
          example: 'Desenvolver interfaces modernas com React',
        },
        experienceLevel: {
          type: 'string',
          enum: ['Júnior', 'Pleno', 'Sênior'],
          description: 'Nível de experiência esperado',
          example: 'Pleno',
        },
      },
      required: ['resume', 'jobTitle', 'experienceLevel'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Análise do currículo realizada com sucesso',
    type: SimulateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou dados de entrada incorretos',
  })
  @ApiResponse({
    status: 502,
    description: 'Erro na comunicação com a API de LLM',
  })
  async simulateWithPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      jobTitle: string;
      jobDescription?: string;
      experienceLevel: 'Júnior' | 'Pleno' | 'Sênior';
      language?: 'pt-br' | 'en';
    },
  ): Promise<SimulateResponseDto> {
    if (!file) {
      throw new BadRequestException('Arquivo PDF é obrigatório');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Arquivo deve ser um PDF');
    }

    // Extrai texto do PDF
    const resumeText = await this.pdfExtractService.extractTextFromPdf(
      file.buffer,
    );

    // Cria o request DTO
    const request: SimulateRequestDto = {
      jobTitle: body.jobTitle,
      jobDescription: body.jobDescription,
      experienceLevel: body.experienceLevel,
      resumeText,
      language: body.language || 'pt-br',
    };

    // Chama o serviço de simulação
    return this.simulateService.simulate(request);
  }
}
