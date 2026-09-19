'use client';

import React from 'react';
import { CREATE_AGENT_STEPS, type StepKey } from './types';
import s from './create-agent.module.css';

interface Props {
  currentStep: StepKey;
  onSelectStep: (step: StepKey) => void;
  completedSteps: Set<StepKey>;
}

export default function CreateAgentStepper({ currentStep, onSelectStep, completedSteps }: Props) {
  const currentIndex = CREATE_AGENT_STEPS.findIndex(step => step.key === currentStep);

  return (
    <nav className={s.stepperWrapper} aria-label="Create agent progress">
      <div className={s.stepperList}>
        {CREATE_AGENT_STEPS.map((step, idx) => {
          const isActive = step.key === currentStep;
          const isCompleted = completedSteps.has(step.key);
          const isUpcoming = !isActive && !isCompleted;

          const circleClass = isActive
            ? `${s.stepCircle} ${s.stepCircleActive}`
            : isCompleted
            ? `${s.stepCircle} ${s.stepCircleCompleted}`
            : `${s.stepCircle} ${s.stepCircleUpcoming}`;

          const labelClass = isActive
            ? `${s.stepLabel} ${s.stepLabelActive}`
            : isCompleted
            ? `${s.stepLabel} ${s.stepLabelCompleted}`
            : `${s.stepLabel} ${s.stepLabelUpcoming}`;

          return (
            <React.Fragment key={step.key}>
              <button
                type="button"
                className={s.stepItem}
                onClick={() => onSelectStep(step.key)}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className={circleClass}>
                  {isCompleted && !isActive ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <span className={labelClass}>{step.label}</span>
              </button>

              {idx < CREATE_AGENT_STEPS.length - 1 && (
                <div
                  className={`${s.stepConnector} ${idx < currentIndex ? s.stepConnectorCompleted : ''}`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
