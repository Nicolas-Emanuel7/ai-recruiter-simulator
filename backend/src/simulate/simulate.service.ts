import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios from 'axios';
import { SimulateRequestDto, SimulateResponseDto } from './simulate.dto';

@Injectable()
export class SimulateService {
  private readonly logger = new Logger(SimulateService.name);
  private readonly llmApiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
  private readonly llmApiKey = process.env.LLM_API_KEY || '';
  private readonly llmModel = process.env.LLM_MODEL || 'gpt-4o-mini';

  async simulate(request: SimulateRequestDto): Promise<SimulateResponseDto> {
    this.logger.log(`Iniciando simulação para vaga: ${request.jobTitle} (${request.experienceLevel})`);
    const prompt = this.buildPrompt(request);
    
    try {
      const response = await this.callLLM(prompt);
      const result = this.parseResponse(response);
      this.logger.log(`Simulação concluída com sucesso. Score ATS: ${result.atsScore}, Decisão: ${result.finalDecision.decision}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao processar simulação: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erro ao processar simulação',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private buildPrompt(request: SimulateRequestDto): string {
    const { jobTitle, jobDescription, experienceLevel, resumeText } = request;

    return `Você é um sistema de triagem de currículos que simula:
1) Um ATS
2) Um recrutador técnico
3) Um recrutador de RH

Avalie o currículo abaixo para a vaga informada.

Vaga:
Título: ${jobTitle}
${jobDescription ? `Descrição: ${jobDescription}` : ''}
Nível esperado: ${experienceLevel}

Currículo:
${resumeText}

Gere a resposta em JSON com a seguinte estrutura:

{
  "atsScore": number (0-100),
  "atsAnalysis": {
    "keywordsMatched": [],
    "keywordsMissing": []
  },
  "technicalEvaluation": {
    "strengths": [],
    "risks": [],
    "perceivedSeniority": ""
  },
  "hrEvaluation": {
    "communication": "",
    "clarity": "",
    "redFlags": []
  },
  "finalDecision": {
    "decision": "AVANÇA | TALVEZ | REPROVA",
    "justification": ""
  },
  "resumeSuggestions": []
}

Seja realista, objetivo e profissional.
Não elogie excessivamente.`;
  }

  private async callLLM(prompt: string): Promise<string> {
    if (!this.llmApiKey) {
      throw new HttpException(
        'LLM_API_KEY não configurada',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await axios.post(
        this.llmApiUrl,
        {
          model: this.llmModel,
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente especializado em análise de currículos. Sempre retorne respostas válidas em JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.llmApiKey}`,
          },
        },
      );

      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new HttpException(
          `Erro na API de LLM: ${error.response?.data?.error?.message || error.message}`,
          HttpStatus.BAD_GATEWAY,
        );
      }
      throw error;
    }
  }

  private parseResponse(responseText: string): SimulateResponseDto {
    try {
      // Remove markdown code blocks se existirem
      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedText);

      // Validação básica da estrutura
      if (
        typeof parsed.atsScore !== 'number' ||
        !parsed.atsAnalysis ||
        !parsed.technicalEvaluation ||
        !parsed.hrEvaluation ||
        !parsed.finalDecision ||
        !Array.isArray(parsed.resumeSuggestions)
      ) {
        throw new Error('Estrutura de resposta inválida');
      }

      return parsed as SimulateResponseDto;
    } catch (error) {
      throw new HttpException(
        'Erro ao processar resposta da LLM',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
