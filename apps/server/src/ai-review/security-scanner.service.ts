import { Injectable, Logger } from '@nestjs/common';
import { ReviewIssue } from './ai-review.service';

interface SecurityPattern {
  pattern: RegExp;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  suggestion: string;
}

@Injectable()
export class SecurityScannerService {
  private readonly logger = new Logger(SecurityScannerService.name);

  private readonly securityPatterns: SecurityPattern[] = [
    {
      pattern: /query\s*\(\s*['"`].*\$\{/i,
      severity: 'ERROR',
      message: 'Potential SQL injection — string interpolation in query',
      suggestion: 'Use parameterized queries or prepared statements',
    },
    {
      pattern: /innerHTML\s*=/i,
      severity: 'WARNING',
      message: 'Potential XSS vulnerability — using innerHTML',
      suggestion: 'Use textContent or sanitize input before setting innerHTML',
    },
    {
      pattern: /(?:password|secret|api_key|token)\s*[:=]\s*['"][^'"]{8,}/i,
      severity: 'ERROR',
      message: 'Possible hardcoded secret or password detected',
      suggestion: 'Move secrets to environment variables',
    },
    {
      pattern: /\beval\s*\(/i,
      severity: 'ERROR',
      message: 'eval() is a security risk and performance anti-pattern',
      suggestion: 'Avoid eval() — use JSON.parse() or specific parsing functions',
    },
    {
      pattern: /Math\.random\s*\(\)/,
      severity: 'WARNING',
      message: 'Math.random() is not cryptographically secure',
      suggestion: 'Use crypto.randomBytes() for security-sensitive randomness',
    },
    {
      pattern: /debugger\s*;/i,
      severity: 'ERROR',
      message: 'Debugger statement found — remove before production',
      suggestion: 'Remove debugger statement',
    },
  ];

  async scan(code: string, language: string): Promise<ReviewIssue[]> {
    this.logger.log(`Running security scan for ${language}`);

    const issues: ReviewIssue[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
        continue;
      }

      for (const secPattern of this.securityPatterns) {
        if (secPattern.pattern.test(line)) {
          issues.push({
            severity: secPattern.severity,
            category: 'SECURITY',
            line: lineNum,
            message: secPattern.message,
            suggestion: secPattern.suggestion,
            confidence: 0.85,
            aiModel: 'security',
          });
        }
      }
    }

    this.logger.log(`Security scan found ${issues.length} issues`);
    return issues;
  }
}
