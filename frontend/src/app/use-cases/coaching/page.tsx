"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, Clock, ChartBar, BookOpen, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CoachingUseCase() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />
      <main className="flex-1 w-full relative flex flex-col items-center pt-28 pb-20">
        <section className="w-full max-w-5xl px-6 text-left">
          
          {/* Tag */}
          <span className="text-body-xs font-bold uppercase tracking-widest text-saffron bg-saffron-muted px-3.5 py-1.5 rounded-full mb-6 border border-saffron-border inline-block">
            EdTech & Admission Intake
          </span>

          {/* Hero */}
          <h1 className="font-display font-extrabold text-display-lg md:text-display-xl text-ink mb-6 leading-tight max-w-4xl">
            Syllabus FAQs & Admission <span className="text-saffron">Qualification</span>
          </h1>
          <p className="text-body-lg text-ink-tertiary mb-12 max-w-2xl leading-relaxed">
            Coaching academies handle massive student/parent call volumes before batch cycles. Bavio AI qualifies course interest, answers fees/syllabus FAQs, and captures CRM leads instantly.
          </p>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left border-y border-line py-8 mb-16">
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">Student Enquiries</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">All conversations qualified</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">Response Rate</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Consistent Call Coverage</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">24/7 Availability</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Qualify midnight traffic</span>
            </div>
          </div>

          {/* Two Column details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
            <div className="lg:col-span-8 flex flex-col gap-8">
              <h2 className="font-display font-bold text-heading-lg text-ink">Resolve Student Inquiry Backlogs</h2>
              <p className="text-body-sm text-ink-tertiary leading-relaxed">
                Parents call at all hours to verify test dates, offline batches, syllabus details, and installment options. Admissions teams get bogged down repeating the same replies. Bavio takes the load off, holding structured qualification flows in English.
              </p>

              <div className="flex flex-col gap-4 bg-surface border border-line rounded-3xl p-6 md:p-8">
                <h3 className="font-bold text-body-md text-ink flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-saffron" />
                  Syllabus & Course Info Retrieval
                </h3>
                <p className="text-body-sm text-ink-tertiary leading-relaxed">
                  Train Bavio on syllabus sheets, course brochures, fee matrices, and refund policies. The agent answers parents&apos; query contexts accurately, never hallucinating rules.
                </p>
              </div>

              <div className="flex flex-col gap-4 bg-surface border border-line rounded-3xl p-6 md:p-8">
                <h3 className="font-bold text-body-md text-ink flex items-center gap-2">
                  <ChartBar className="w-5 h-5 text-saffron" />
                  Lead Scoring & Dashboard Logging
                </h3>
                <p className="text-body-sm text-ink-tertiary leading-relaxed">
                  Classify student intent (high intent vs general queries). Push details instantly into the lead dashboard, alerting sales counselors for callback closure.
                </p>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6 bg-surface border border-line p-6 rounded-3xl">
              <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-2">Capabilities</h3>
              <ul className="flex flex-col gap-4 text-body-sm text-ink-tertiary">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Syllabus PDF delivery via SMS</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Batch timings & offline availability</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Counseling request collection</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Fee installment qualifications</span>
                </li>
              </ul>
              <Link
                href="/contact?vertical=coaching"
                className="mt-4 bg-saffron hover:bg-saffron-hover text-white text-body-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
              >
                Request Coaching Demo
                <ArrowRight className="w-3.5 h-3.5" weight="bold" />
              </Link>
            </div>
          </div>

        </section>
      </main>
      <Footer />
    </div>
  );
}
