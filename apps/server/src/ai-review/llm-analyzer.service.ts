import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReviewIssue } from './ai-review.service';

interface LlmReviewResponse {
  issues: Array<{
    severity: string;
    category: string;
    line: number;
    column?: number;
    message: string;
    suggestion?: string;
    confidence: number;
  }>;
  summary: string;
  improvedCode?: string;
}

@Injectable()
export class LlmAnalyzerService {
  private readonly logger = new Logger(LlmAnalyzerService.name);

  constructor(private readonly configService: ConfigService) {}

  async analyze(
    code: string,
    language: string,
  ): Promise<{ issues: ReviewIssue[]; summary: string; improvedCode?: string }> {
    this.logger.log(`Running LLM analysis for ${language}`);

    const apiKey = this.configService.get<string>('ai.anthropic_api_key');
    const model = this.configService.get<string>('ai.model', 'claude-opus-4.8');
    const baseUrl = this.configService.get<string>('ai.base_url', 'https://api.nhà cung cấp dịch vụ AI.com');

    if (!apiKey) {
      this.logger.warn('No AI API key — skipping LLM analysis');
      return { issues: [], summary: 'LLM analysis skipped — no API key configured' };
    }

    try {
      const prompt = this.buildPrompt(code, language);

      const response = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Claude API error: ${error}`);
        return { issues: [], summary: `LLM analysis failed: ${response.statusText}` };
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '';

      const parsed = this.parseLlmResponse(content);

      const issues: ReviewIssue[] = parsed.issues.map((issue) => ({
        severity: this.normalizeSeverity(issue.severity),
        category: this.normalizeCategory(issue.category),
        line: issue.line,
        column: issue.column,
        message: issue.message,
        suggestion: issue.suggestion,
        confidence: Math.min(1, Math.max(0, issue.confidence)),
        aiModel: 'llm' as const,
      }));

      this.logger.log(`LLM analysis found ${issues.length} issues`);

      return {
        issues,
        summary: parsed.summary,
        improvedCode: parsed.improvedCode,
      };
    } catch (error) {
      this.logger.error('LLM analysis failed', error);
      return { issues: [], summary: 'LLM analysis failed due to an error' };
    }
  }

  private buildPrompt(code: string, language: string): string {
    return `You are a senior code reviewer. Analyze the following ${language} code for:
1. Potential bugs and logic errors
2. Security vulnerabilities
3. Performance bottlenecks
4. Code smells and maintainability issues
5. Missing error handling

Return JSON:
{
  "issues": [
    {
      "severity": "ERROR|WARNING|INFO|SUGGESTION",
      "category": "BUG|SECURITY|PERFORMANCE|MAINTAINABILITY|STYLE",
      "line": 42,
      "message": "Description",
      "suggestion": "How to fix",
      "confidence": 0.85
    }
  ],
  "summary": "Brief assessment",
  "improvedCode": "Optional improved code"
}

Code:
\`\`\`${language}
${code}
\`\`\``;
  }

  private parseLlmResponse(content: string): LlmReviewResponse {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      this.logger.warn('Failed to parse LLM JSON response');
    }

    return { issues: [], summary: content.slice(0, 500) };
  }

  private normalizeSeverity(severity: string): 'ERROR' | 'WARNING' | 'INFO' | 'SUGGESTION' {
    const map: Record<string, 'ERROR' | 'WARNING' | 'INFO' | 'SUGGESTION'> = {
      error: 'ERROR', critical: 'ERROR', bug: 'ERROR',
      warning: 'WARNING', warn: 'WARNING',
      info: 'INFO',
      suggestion: 'SUGGESTION', hint: 'SUGGESTION',
    };
    return map[severity.toLowerCase()] || 'INFO';
  }

  private normalizeCategory(category: string): 'BUG' | 'SECURITY' | 'PERFORMANCE' | 'MAINTAINABILITY' | 'STYLE' {
    const map: Record<string, 'BUG' | 'SECURITY' | 'PERFORMANCE' | 'MAINTAINABILITY' | 'STYLE'> = {
      bug: 'BUG', correctness: 'BUG',
      security: 'SECURITY', vulnerability: 'SECURITY',
      performance: 'PERFORMANCE', optimization: 'PERFORMANCE',
      maintainability: 'MAINTAINABILITY', readability: 'MAINTAINABILITY',
      style: 'STYLE', convention: 'STYLE',
    };
    return map[category.toLowerCase()] || 'MAINTAINABILITY';
  }
}
