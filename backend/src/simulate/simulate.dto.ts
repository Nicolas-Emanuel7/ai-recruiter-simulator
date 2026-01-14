import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SimulateRequestDto {
  @ApiProperty({
    description: 'Título da vaga',
    example: 'Frontend Developer',
  })
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada da vaga',
    example: 'Desenvolver interfaces modernas com React e TypeScript',
  })
  @IsString()
  @IsOptional()
  jobDescription?: string;

  @ApiProperty({
    description: 'Nível de experiência esperado',
    enum: ['Júnior', 'Pleno', 'Sênior'],
    example: 'Pleno',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['Júnior', 'Pleno', 'Sênior'])
  experienceLevel: 'Júnior' | 'Pleno' | 'Sênior';

  @ApiProperty({
    description: 'Texto completo do currículo a ser analisado',
    example: 'Desenvolvedor com 3 anos de experiência em React, TypeScript...',
  })
  @IsString()
  @IsNotEmpty()
  resumeText: string;
}

export class AtsAnalysisDto {
  @ApiProperty({ description: 'Palavras-chave encontradas no currículo', example: ['React', 'TypeScript'] })
  keywordsMatched: string[];

  @ApiProperty({ description: 'Palavras-chave faltantes no currículo', example: ['Node.js', 'AWS'] })
  keywordsMissing: string[];
}

export class TechnicalEvaluationDto {
  @ApiProperty({ description: 'Pontos fortes técnicos identificados', example: ['Experiência em React', 'Conhecimento em TypeScript'] })
  strengths: string[];

  @ApiProperty({ description: 'Riscos técnicos identificados', example: ['Falta de experiência em testes'] })
  risks: string[];

  @ApiProperty({ description: 'Senioridade percebida', example: 'Pleno' })
  perceivedSeniority: string;
}

export class HrEvaluationDto {
  @ApiProperty({ description: 'Avaliação da comunicação', example: 'Adequada' })
  communication: string;

  @ApiProperty({ description: 'Avaliação da clareza do currículo', example: 'Moderada' })
  clarity: string;

  @ApiProperty({ description: 'Sinais de alerta identificados', example: [] })
  redFlags: string[];
}

export class FinalDecisionDto {
  @ApiProperty({ 
    description: 'Decisão final da triagem',
    enum: ['AVANÇA', 'TALVEZ', 'REPROVA'],
    example: 'TALVEZ'
  })
  decision: 'AVANÇA' | 'TALVEZ' | 'REPROVA';

  @ApiProperty({ description: 'Justificativa da decisão', example: 'Candidato possui experiência relevante, mas faltam detalhes...' })
  justification: string;
}

export class SimulateResponseDto {
  @ApiProperty({ description: 'Score ATS (0-100)', example: 75 })
  atsScore: number;

  @ApiProperty({ description: 'Análise ATS', type: AtsAnalysisDto })
  atsAnalysis: AtsAnalysisDto;

  @ApiProperty({ description: 'Avaliação técnica', type: TechnicalEvaluationDto })
  technicalEvaluation: TechnicalEvaluationDto;

  @ApiProperty({ description: 'Avaliação de RH', type: HrEvaluationDto })
  hrEvaluation: HrEvaluationDto;

  @ApiProperty({ description: 'Decisão final', type: FinalDecisionDto })
  finalDecision: FinalDecisionDto;

  @ApiProperty({ description: 'Sugestões de melhoria para o currículo', example: ['Incluir exemplos de projetos...'] })
  resumeSuggestions: string[];
}
