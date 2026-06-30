import { Injectable, Logger } from '@nestjs/common';
import { ReviewIssue } from './ai-review.service';

@Injectable()
export class StaticAnalyzerService {
  private readonly logger = new Logger(StaticAnalyzerService.name);

  async analyze(code: string, language: string): Promise<ReviewIssue[]> {
    this.logger.log(`Running static analysis for ${language}`);

    const issues: ReviewIssue[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Console.log
      if (this.matchesPattern(line, language, 'console')) {
        issues.push({
          severity: 'WARNING',
          category: 'MAINTAINABILITY',
          line: lineNum,
          message: 'Consider removing console statement in production code',
          suggestion: 'Remove or replace with proper logging',
          confidence: 0.9,
          aiModel: 'static',
        });
      }

      // TODO/FIXME
      const todoMatch = line.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/i);
      if (todoMatch) {
        issues.push({
          severity: 'INFO',
          category: 'MAINTAINABILITY',
          line: lineNum,
          message: `Found ${todoMatch[1]} comment — should be addressed before production`,
          confidence: 0.95,
          aiModel: 'static',
        });
      }

      // var usage
      if (language === 'typescript' || language === 'javascript') {
        if (/^\s*var\s/.test(line)) {
          issues.push({
            severity: 'WARNING',
            category: 'STYLE',
            line: lineNum,
            message: 'Use "const" or "let" instead of "var"',
            confidence: 0.95,
            aiModel: 'static',
          });
        }
      }

      // Long lines
      if (line.length > 120) {
        issues.push({
          severity: 'SUGGESTION',
          category: 'MAINTAINABILITY',
          line: lineNum,
          message: `Line exceeds 120 characters (${line.length} chars)`,
          confidence: 0.7,
          aiModel: 'static',
        });
      }
    }

    this.logger.log(`Static analysis found ${issues.length} issues`);
    return issues;
  }

  private matchesPattern(line: string, language: string, pattern: string): boolean {
    if (pattern === 'console') {
      if (language === 'typescript' || language === 'javascript') {
        return /console\.(log|debug|info|warn|error)\(/.test(line) && !line.trim().startsWith('//');
      }
    }
    return false;
  }
}
