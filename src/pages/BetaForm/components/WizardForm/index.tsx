import * as React from "react";
import { useSearchParams } from "react-router";

import * as Step from "./steps";
import { STEP_TITLES, useWizardForm } from "./useWizardForm";
import type { FormData } from "./schema";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import * as CardComponent from "@/components/ui/Card";
import * as TooltipComponent from "@/components/ui/Tooltip";
import * as DialogComponent from "@/components/ui/Dialog";
import * as Lucide from "lucide-react";

import { ExternalLink } from "@/components/common/ExternalLink";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import {
  clearIdempotencyKey,
  getAdoptionApplicationId,
  getOrCreateIdempotencyKey,
  type AdoptionSubmissionResult,
} from "./submission";
import { ADOPTION_RECAPTCHA_ACTION } from "./recaptcha";
import { WIZARD_STORAGE_KEYS } from "./wizardStorage";

import styles from "./WizardForm.module.css";

interface WizardFormProps {
  onSubmitSuccess?: (result: AdoptionSubmissionResult) => void;
}

export function WizardForm({ onSubmitSuccess }: WizardFormProps) {
  const [searchParams] = useSearchParams();
  const petName = searchParams.get("pet") || "";
  const isDesktop = useIsDesktop();
  const submissionKeyRef = React.useRef<string | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showWarning, setShowWarning] = React.useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem(WIZARD_STORAGE_KEYS.showWarning);
      return saved === null ? true : saved === "true";
    } catch {
      return true;
    }
  });

  const [showResumeDialog, setShowResumeDialog] = React.useState<boolean>(
    () => {
      try {
        const savedData = sessionStorage.getItem(WIZARD_STORAGE_KEYS.formData);
        return (
          !!savedData &&
          savedData !== "{}" &&
          !sessionStorage.getItem(WIZARD_STORAGE_KEYS.dialogShown)
        );
      } catch {
        return false;
      }
    },
  );

  const {
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    progress,
    formData,
    errors,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    validateCurrentStep,
    highestCompletedStep,
    resetForm,
  } = useWizardForm();

  React.useEffect(() => {
    const scriptId = "recaptcha-v3-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;

      const siteKey = import.meta.env.VITE_RECAPTCHA_PUBLIC_KEY as string;
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      document.body.appendChild(script);
    }
  }, []);

  const handleResume = () => {
    setShowResumeDialog(false);
    try {
      sessionStorage.setItem(WIZARD_STORAGE_KEYS.dialogShown, "true");
    } catch {
      /* sem suporte a sessionStorage */
    }
  };

  const handleRestart = () => {
    resetForm();
    submissionKeyRef.current = null;
    setShowResumeDialog(false);
    try {
      sessionStorage.setItem(WIZARD_STORAGE_KEYS.dialogShown, "true");
    } catch {
      /* sem suporte a sessionStorage */
    }
  };

  React.useEffect(() => {
    try {
      sessionStorage.setItem(
        WIZARD_STORAGE_KEYS.showWarning,
        String(showWarning),
      );
    } catch {
      /* sem suporte a sessionStorage */
    }
  }, [showWarning]);

  const { label, icon: Icon } = STEP_TITLES[currentStep];

  // pré-preencher nome do pet
  const handleUpdateField = React.useCallback(
    (field: keyof FormData, value: string | number) => {
      updateField(field, value);
    },
    [updateField],
  );

  React.useEffect(() => {
    if (petName && !formData.animal_especifico) {
      updateField("animal_especifico", petName);
    }
  }, [petName, formData.animal_especifico, updateField]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const siteKey = import.meta.env.VITE_RECAPTCHA_PUBLIC_KEY;

      // Captura do token do reCAPTCHA v3
      const token = await new Promise<string>((resolve, reject) => {
        // @ts-expect-error - grecaptcha não está tipado no global
        if (!window.grecaptcha) {
          reject(new Error("reCAPTCHA não carregou corretamente."));
          return;
        }

        // @ts-expect-error - grecaptcha não está tipado no global
        grecaptcha.ready(() => {
          // @ts-expect-error - grecaptcha não está tipado no global
          grecaptcha
            .execute(siteKey, { action: ADOPTION_RECAPTCHA_ACTION })
            .then((token: string) => resolve(token))
            .catch(reject);
        });
      });

      const idempotencyKey =
        submissionKeyRef.current ?? getOrCreateIdempotencyKey(sessionStorage);
      submissionKeyRef.current = idempotencyKey;

      const response = await fetch("/api/adoption/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          ...formData,
          captchaToken: token,
        }),
      });

      const submissionResult = await getAdoptionApplicationId(response);
      clearIdempotencyKey(sessionStorage);
      submissionKeyRef.current = null;

      if (onSubmitSuccess) {
        onSubmitSuccess(submissionResult);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao enviar formulário. Tente novamente.";
      setSubmitError(message);
      console.error("Error submitting application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepProps = {
    formData,
    errors,
    updateField: handleUpdateField,
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step.Step1DadosPessoais {...stepProps} />;
      case 1:
        return <Step.Step2Familia {...stepProps} />;
      case 2:
        return <Step.Step3Adocao {...stepProps} />;
      case 3:
        return <Step.Step4Moradia {...stepProps} />;
      case 4:
        return <Step.Step5Historico {...stepProps} />;
      case 5:
        return <Step.Step6Responsabilidades {...stepProps} />;
      case 6:
        return <Step.Step7Termos {...stepProps} />;
      case 7:
        return <Step.Step8Hipoteticas {...stepProps} />;
      case 8:
        return <Step.Step9Situacoes {...stepProps} />;
      case 9:
        return <Step.Step10Finalizacao {...stepProps} />;

      default:
        return null;
    }
  };

  if (showWarning) {
    return (
      <div className={styles.wizardContainer}>
        <CardComponent.Card variant="callout" tone="warning" size="lg">
          <CardComponent.CardBody>
            <CardComponent.CardHeader>
              <CardComponent.CardIcon>
                <Lucide.AlertTriangle size={35} />
              </CardComponent.CardIcon>
              <CardComponent.CardTitle>
                LEIA ANTES DE INICIAR
              </CardComponent.CardTitle>
            </CardComponent.CardHeader>
            <CardComponent.CardContent>
              <p>
                O preenchimento deste documento <strong>não garante</strong> a
                adoção. Caso aprovada, as respostas serão anexadas ao Termo de
                Responsabilidade.
              </p>
              <p>
                Resgatar animais não é uma profissão e não recebemos auxílio
                governamental. Todo trabalho é feito com recurso próprio. Desta
                forma, pedimos{" "}
                <strong>contribuição no valor de R$ 300,00</strong>. Esse valor
                auxilia na alimentação, tratamento e castração.
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <strong>Requisitos e Considerações:</strong> Ter acima de 18
                anos. Necessário condições financeiras (custo médio R$
                300-400/mês). Pode levar meses para adaptar. Animais fazem
                sujeira e precisam de veterinário.{" "}
                <strong>Abandonar é crime!</strong>
              </p>
            </CardComponent.CardContent>
          </CardComponent.CardBody>
        </CardComponent.Card>

        <div className={styles.warningActions}>
          <Button
            size={isDesktop ? "lg" : "md"}
            onClick={() => setShowWarning(false)}
            rightIcon={<Lucide.ArrowRight size={18} />}
          >
            Li e quero prosseguir
          </Button>
        </div>

        <div className={styles.privacyDisclaimer}>
          <p>
            Ao clicar em "Li e quero prosseguir" você concorda com nossa{" "}
            <ExternalLink href="">política de privacidade</ExternalLink>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wizardContainer}>
      <div className={styles.wizardHeader}>
        {/* Step Title */}
        <div className={styles.currentStepTitle}>
          <Badge variant="secondary" size="lg" leftIcon={<Icon />}>
            {label}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressSection}>
          <div className={styles.progressInfo}>
            <span>
              Etapa {currentStep + 1} de {totalSteps}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className={styles.stepIndicators}>
          {STEP_TITLES.map((step, index) => (
            <TooltipComponent.TooltipProvider key={index}>
              <TooltipComponent.Tooltip>
                <TooltipComponent.TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant={
                      currentStep === index
                        ? "secondary"
                        : index < currentStep
                          ? "success"
                          : "outline"
                    }
                    className={`${styles.stepIndicator} ${
                      index === currentStep ? styles.stepActive : ""
                    } ${index < currentStep ? styles.stepCompleted : ""}`}
                    onClick={() => goToStep(index)}
                    disabled={index > highestCompletedStep}
                  >
                    {index < currentStep ? (
                      <Lucide.Check size={18} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </Button>
                </TooltipComponent.TooltipTrigger>
                <TooltipComponent.TooltipContent side="bottom">
                  <p>{step.label}</p>
                </TooltipComponent.TooltipContent>
              </TooltipComponent.Tooltip>
            </TooltipComponent.TooltipProvider>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={onSubmit}>
        <div className={styles.stepWrapper}>{renderStep()}</div>

        {/* Error summary */}
        {Object.keys(errors).length > 0 && (
          <div className={styles.errorSummary}>
            <Lucide.AlertTriangle size={18} />
            <span>Preencha todos os campos obrigatórios antes de avançar.</span>
          </div>
        )}

        {submitError && (
          <div
            className={styles.submitError}
            role="alert"
            aria-live="assertive"
          >
            <Lucide.CircleAlert size={18} />
            <span>{submitError}</span>
          </div>
        )}

        {/* Navigation */}
        <div className={styles.navigation}>
          {!isFirstStep && (
            <Button
              type="button"
              variant="secondary"
              size={isDesktop ? "lg" : "md"}
              onClick={prevStep}
              leftIcon={<Lucide.ArrowLeft size={22} />}
            >
              Anterior
            </Button>
          )}

          <div className={styles.navigationSpacer} />

          {!isLastStep ? (
            <Button
              type="button"
              size={isDesktop ? "lg" : "md"}
              onClick={nextStep}
              rightIcon={<Lucide.ArrowRight size={22} />}
            >
              Próximo
            </Button>
          ) : (
            <Button
              type="submit"
              size={isDesktop ? "lg" : "md"}
              disabled={isSubmitting}
              rightIcon={<Lucide.Send size={22} />}
            >
              {isSubmitting ? "Enviando..." : "Enviar Respostas"}
            </Button>
          )}
        </div>
      </form>

      <DialogComponent.Dialog
        open={showResumeDialog}
        onOpenChange={setShowResumeDialog}
      >
        <DialogComponent.DialogContent>
          <DialogComponent.DialogHeader>
            <DialogComponent.DialogTitle>
              <Lucide.CircleQuestionMark size={25} color="var(--primary)" />
              Continuar preenchimento?
            </DialogComponent.DialogTitle>
            <DialogComponent.DialogDescription>
              Encontramos dados salvos de um preenchimento anterior. Deseja
              continuar de onde parou ou começar um novo formulário?
            </DialogComponent.DialogDescription>
          </DialogComponent.DialogHeader>
          <DialogComponent.DialogFooter className={styles.dialogFooter}>
            <Button variant="outline" onClick={handleRestart}>
              Começar um novo
            </Button>
            <Button onClick={handleResume}>Continuar preenchimento</Button>
          </DialogComponent.DialogFooter>
        </DialogComponent.DialogContent>
      </DialogComponent.Dialog>
    </div>
  );
}
