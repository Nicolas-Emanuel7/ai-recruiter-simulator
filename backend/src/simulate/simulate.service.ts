import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios from 'axios';
import { SimulateRequestDto, SimulateResponseDto } from './simulate.dto';

@Injectable()
export class SimulateService {
  private readonly logger = new Logger(SimulateService.name);
  private readonly llmApiUrl =
    process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
  private readonly llmApiKey = process.env.LLM_API_KEY || '';
  private readonly llmModel = process.env.LLM_MODEL || 'gpt-4o-mini';

  async simulate(request: SimulateRequestDto): Promise<SimulateResponseDto> {
    const language = request.language || 'pt-br';
    this.logger.log(
      `Iniciando simulação para vaga: ${request.jobTitle} (${request.experienceLevel}) [${language}]`,
    );
    const prompt = this.buildPrompt(request);

    try {
      const response = await this.callLLM(prompt, language);
      const result = this.parseResponse(response);
      this.logger.log(
        `Simulação concluída com sucesso. Score ATS: ${result.atsScore}, Decisão: ${result.finalDecision.decision}`,
      );
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Erro ao processar simulação: ${errorMessage}`,
        errorStack,
      );

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
    const {
      jobTitle,
      jobDescription,
      experienceLevel,
      resumeText,
      language = 'pt-br',
    } = request;

    const isEnglish = language === 'en';
    const langInstructions = isEnglish
      ? 'IMPORTANT: Respond in English. All text, justifications, suggestions, and evaluations must be in English.'
      : 'IMPORTANT: Responda em Português do Brasil. Todo o texto, justificativas, sugestões e avaliações devem estar em Português do Brasil.';

    const decisionValues = isEnglish
      ? 'PASS | MAYBE | REJECT'
      : 'AVANÇA | TALVEZ | REPROVA';

    return `${langInstructions}

Você é um sistema de triagem de currículos que simula:
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
    "decision": "${decisionValues}",
    "justification": ""
  },
  "resumeSuggestions": []
}

Seja realista, objetivo e profissional.
Não elogie excessivamente.`;
  }

  private async callLLM(
    prompt: string,
    language: string = 'pt-br',
  ): Promise<string> {
    if (!this.llmApiKey) {
      throw new HttpException(
        'LLM_API_KEY não configurada',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const systemMessage =
      language === 'en'
        ? 'You are an assistant specialized in resume analysis. Always return valid JSON responses. Respond in English.'
        : 'Você é um assistente especializado em análise de currículos. Sempre retorne respostas válidas em JSON. Responda em Português do Brasil.';

    try {
      interface OpenAIChatResponse {
        choices: Array<{
          message?: {
            content?: string;
          };
        }>;
      }

      const response = await axios.post<OpenAIChatResponse>(
        this.llmApiUrl,
        {
          model: this.llmModel,
          messages: [
            {
              role: 'system',
              content: systemMessage,
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
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          (error.response?.data as { error?: { message?: string } })?.error
            ?.message || error.message;
        throw new HttpException(
          `Erro na API de LLM: ${errorMessage}`,
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

      const parsed: unknown = JSON.parse(cleanedText);

      // Validação básica da estrutura
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !('atsScore' in parsed) ||
        typeof (parsed as { atsScore: unknown }).atsScore !== 'number' ||
        !('atsAnalysis' in parsed) ||
        !('technicalEvaluation' in parsed) ||
        !('hrEvaluation' in parsed) ||
        !('finalDecision' in parsed) ||
        !('resumeSuggestions' in parsed) ||
        !Array.isArray(
          (parsed as { resumeSuggestions: unknown }).resumeSuggestions,
        )
      ) {
        throw new Error('Estrutura de resposta inválida');
      }

      return parsed as SimulateResponseDto;
    } catch {
      throw new HttpException(
        'Erro ao processar resposta da LLM',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
