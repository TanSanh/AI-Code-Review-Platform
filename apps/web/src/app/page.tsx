import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Code2,
  Shield,
  Zap,
  MessageSquare,
  BarChart3,
  GitBranch,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Security Analysis',
    description: 'Detect SQL injection, XSS, hardcoded secrets, and other vulnerabilities before they reach production.',
  },
  {
    icon: Zap,
    title: 'Performance Insights',
    description: 'Identify performance bottlenecks, memory leaks, and optimization opportunities in your code.',
  },
  {
    icon: Code2,
    title: 'Code Quality',
    description: 'Get actionable feedback on code smells, maintainability issues, and best practice violations.',
  },
  {
    icon: MessageSquare,
    title: 'Real-time Collaboration',
    description: 'Discuss issues with your team in real-time. Comment on specific lines and resolve threads.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track code quality trends, issue resolution rates, and team performance over time.',
  },
  {
    icon: GitBranch,
    title: 'Multi-language Support',
    description: 'Support for TypeScript, JavaScript, Python, Java, Go, Rust, and more programming languages.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Upload Your Code',
    description: 'Paste your code or upload a file. We support 10+ programming languages.',
  },
  {
    step: '02',
    title: 'AI Analysis',
    description: 'Our 3-layer AI engine analyzes your code for bugs, security issues, and improvements.',
  },
  {
    step: '03',
    title: 'Review & Discuss',
    description: 'Review AI findings, discuss with your team, and resolve issues in real-time.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className="text-display-hero text-white mb-6">
              Intelligent Code Review
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-10">
              Get instant AI-powered feedback on bugs, security vulnerabilities, and code quality.
              Ship better code, faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="cream" size="lg" className="text-base">
                  Start Reviewing Code
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/#how-it-works">
                <Button variant="ghost" size="lg" className="text-base text-white hover:text-white/80 hover:bg-white/10">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-display-section text-charcoal mb-4">
              Everything you need for better code
            </h2>
            <p className="text-body-emphasis text-charcoal/60 max-w-2xl mx-auto">
              A comprehensive code review platform powered by advanced AI analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="card-super">
                <CardContent className="p-6">
                  <feature.icon className="h-10 w-10 text-lavender mb-4" />
                  <h3 className="text-body-heading font-semibold text-charcoal mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-body text-charcoal/60">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-cream/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-display-section text-charcoal mb-4">
              How it works
            </h2>
            <p className="text-body-emphasis text-charcoal/60 max-w-2xl mx-auto">
              Three simple steps to smarter code reviews.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-mysteria text-white text-2xl font-bold mb-6">
                  {step.step}
                </div>
                <h3 className="text-body-heading font-semibold text-charcoal mb-3">
                  {step.title}
                </h3>
                <p className="text-body text-charcoal/60">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-display-section text-charcoal mb-6">
            Ready to write better code?
          </h2>
          <p className="text-body-emphasis text-charcoal/60 mb-10 max-w-2xl mx-auto">
            Join thousands of developers who are shipping better code with AI-powered reviews.
          </p>
          <Link href="/register">
            <Button variant="cream" size="lg" className="text-base">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
