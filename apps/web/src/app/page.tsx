'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
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

export default function HomePage() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Shield,
      titleKey: 'landing.securityTitle',
      descKey: 'landing.securityDesc',
    },
    {
      icon: Zap,
      titleKey: 'landing.performanceTitle',
      descKey: 'landing.performanceDesc',
    },
    {
      icon: Code2,
      titleKey: 'landing.qualityTitle',
      descKey: 'landing.qualityDesc',
    },
    {
      icon: MessageSquare,
      titleKey: 'landing.collabTitle',
      descKey: 'landing.collabDesc',
    },
    {
      icon: BarChart3,
      titleKey: 'landing.analyticsTitle',
      descKey: 'landing.analyticsDesc',
    },
    {
      icon: GitBranch,
      titleKey: 'landing.multiLangTitle',
      descKey: 'landing.multiLangDesc',
    },
  ];

  const steps = [
    { step: '01', titleKey: 'landing.step1Title', descKey: 'landing.step1Desc' },
    { step: '02', titleKey: 'landing.step2Title', descKey: 'landing.step2Desc' },
    { step: '03', titleKey: 'landing.step3Title', descKey: 'landing.step3Desc' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1120]">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className="text-display-hero text-white mb-6">
              {t('landing.heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-10">
              {t('landing.heroSubtitle1')}
              <br />
              {t('landing.heroSubtitle2')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="cream" size="lg" className="text-base">
                  {t('landing.startReviewing')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/#how-it-works">
                <Button variant="ghost" size="lg" className="text-base text-white hover:text-white/80 hover:bg-white/10">
                  {t('landing.seeHowItWorks')}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-[#0b1120] to-transparent" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-[#0b1120]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-display-section text-charcoal dark:text-gray-50 mb-4">
              {t('landing.everythingTitle')}
            </h2>
            <p className="text-body-emphasis text-charcoal/60 dark:text-gray-400 max-w-2xl mx-auto">
              {t('landing.everythingDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.titleKey} className="card-super">
                <CardContent className="p-6">
                  <feature.icon className="h-10 w-10 text-lavender mb-4" />
                  <h3 className="text-body-heading font-semibold text-charcoal dark:text-gray-100 mb-2">
                    {t(feature.titleKey as any)}
                  </h3>
                  <p className="text-body text-charcoal/60 dark:text-gray-400">
                    {t(feature.descKey as any)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-cream/30 dark:bg-[#1a2332]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-display-section text-charcoal dark:text-gray-50 mb-4">
              {t('landing.howItWorksTitle')}
            </h2>
            <p className="text-body-emphasis text-charcoal/60 dark:text-gray-400 max-w-2xl mx-auto">
              {t('landing.howItWorksDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-mysteria dark:bg-lavender text-white text-2xl font-bold mb-6">
                  {step.step}
                </div>
                <h3 className="text-body-heading font-semibold text-charcoal dark:text-gray-100 mb-3">
                  {t(step.titleKey as any)}
                </h3>
                <p className="text-body text-charcoal/60 dark:text-gray-400">
                  {t(step.descKey as any)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-[#0b1120]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-display-section text-charcoal dark:text-gray-50 mb-6">
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-body-emphasis text-charcoal/60 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            {t('landing.ctaDesc')}
          </p>
          <Link href="/register">
            <Button variant="cream" size="lg" className="text-base">
              {t('landing.ctaButton')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
