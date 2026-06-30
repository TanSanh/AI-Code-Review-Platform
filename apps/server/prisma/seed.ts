import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      role: 'MEMBER',
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  const review = await prisma.review.create({
    data: {
      title: 'Sample: Authentication Controller',
      description: 'Reviewing auth controller for security and best practices',
      language: 'typescript',
      fileName: 'auth.controller.ts',
      originalCode: `import { Controller, Post, Body } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() body: any) {
    // TODO: Add validation
    const query = \\\`SELECT * FROM users WHERE email = '\${body.email}' AND password = '\${body.password}'\\\`;
    const result = await db.query(query);

    if (result.rows.length > 0) {
      console.log('User logged in:', body.email);
      return { token: 'hardcoded-token-123' };
    }

    return { error: 'Invalid credentials' };
  }
}`,
      status: 'COMPLETED',
      score: 35,
      authorId: user.id,
      completedAt: new Date(),
    },
  });

  console.log(`✅ Created review: ${review.title}`);

  const issues = [
    {
      severity: 'ERROR' as const,
      category: 'SECURITY' as const,
      line: 10,
      message: 'SQL Injection vulnerability — string interpolation in query',
      suggestion: 'Use parameterized queries: db.query("SELECT * FROM users WHERE email = $1", [body.email])',
      confidence: 0.98,
      aiModel: 'security',
      reviewId: review.id,
    },
    {
      severity: 'ERROR' as const,
      category: 'SECURITY' as const,
      line: 10,
      message: 'Hardcoded token in response',
      suggestion: 'Generate JWT token using jwt.sign() with user payload',
      confidence: 0.95,
      aiModel: 'static',
      reviewId: review.id,
    },
    {
      severity: 'WARNING' as const,
      category: 'MAINTAINABILITY' as const,
      line: 6,
      message: 'Using "any" type for request body — no input validation',
      suggestion: 'Create a LoginDto class with class-validator decorators',
      confidence: 0.9,
      aiModel: 'static',
      reviewId: review.id,
    },
    {
      severity: 'INFO' as const,
      category: 'MAINTAINABILITY' as const,
      line: 8,
      message: 'TODO comment found — should be addressed before production',
      confidence: 0.95,
      aiModel: 'static',
      reviewId: review.id,
    },
    {
      severity: 'WARNING' as const,
      category: 'BUG' as const,
      line: 14,
      message: 'Password comparison should use bcrypt.compare(), not SQL',
      suggestion: 'Fetch user by email only, then compare password hash in application code',
      confidence: 0.92,
      aiModel: 'llm',
      reviewId: review.id,
    },
  ];

  await prisma.issue.createMany({ data: issues });
  console.log(`✅ Created ${issues.length} sample issues`);

  await prisma.comment.createMany({
    data: [
      {
        content: 'This SQL injection is critical — needs immediate fix!',
        lineRef: 10,
        reviewId: review.id,
        authorId: user.id,
      },
      {
        content: 'Agreed. We should also add input validation middleware.',
        reviewId: review.id,
        authorId: user.id,
        isBot: true,
      },
    ],
  });

  console.log('✅ Created sample comments');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
