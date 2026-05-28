"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { type BookingInput, bookingSchema, SERVICE_SLUGS } from "@/lib/booking-schema";

type BookingFormInput = z.input<typeof bookingSchema>;
import BookingProgress from "@/components/booking-progress";
import BookingStepVehicle from "@/components/booking-step-vehicle";
import BookingStepWhen from "@/components/booking-step-when";
import BookingStepPhotos from "@/components/booking-step-photos";
import BookingSuccess from "@/components/booking-success";
import Reveal from "@/components/reveal";

type Step = 0 | 1 | 2;

const STEP_FIELDS: Record<Step, (keyof BookingFormInput)[]> = {
  0: ["service", "year", "make", "model", "color"],
  1: ["address", "city", "zip", "date", "timeWindow"],
  2: ["name", "email", "phone", "notes"],
};

export default function BookingSection() {
  const methods = useForm<BookingFormInput, unknown, BookingInput>({
    resolver: zodResolver(bookingSchema),
    mode: "onTouched",
    defaultValues: {
      service: "full-package",
      year: undefined,
      make: "",
      model: "",
      color: "",
      address: "",
      city: "",
      zip: "",
      date: "",
      timeWindow: "morning",
      name: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  const [step, setStep] = useState<Step>(0);
  const [files, setFiles] = useState<File[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [submittedName, setSubmittedName] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const match = hash.match(/service=([a-z-]+)/);
    if (!match) return;
    const slug = match[1];
    if ((SERVICE_SLUGS as readonly string[]).includes(slug)) {
      methods.setValue("service", slug as BookingFormInput["service"]);
    }
  }, [methods]);

  const onNext = async () => {
    const ok = await methods.trigger(STEP_FIELDS[step]);
    if (ok) setStep((s) => (Math.min(2, s + 1) as Step));
  };
  const onBack = () => setStep((s) => (Math.max(0, s - 1) as Step));

  const onSubmit = methods.handleSubmit(async (data) => {
    setSubmitState("submitting");
    setServerError(null);
    const fd = new FormData();
    (Object.entries(data) as [string, unknown][]).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    files.forEach((f) => fd.append("photos", f));

    try {
      const res = await fetch("/api/booking", { method: "POST", body: fd });
      if (res.ok) {
        setSubmittedName(data.name);
        setSubmitState("ok");
        return;
      }
      const body = await res.json().catch(() => ({}));
      setServerError(body?.error === "validation" ? "Some fields need fixing." : "Couldn't send right now.");
      setSubmitState("error");
    } catch {
      setServerError("Network issue — please try again or call.");
      setSubmitState("error");
    }
  });

  if (submitState === "ok") {
    return (
      <section id="book" className="relative py-32 md:py-44 border-t border-line">
        <div className="mx-auto max-w-3xl px-6">
          <BookingSuccess name={submittedName} />
        </div>
      </section>
    );
  }

  return (
    <section id="book" aria-labelledby="book-h" className="relative py-32 md:py-44 border-t border-line">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal>
          <p className="eyebrow">Book a detail</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="book-h" className="headline mt-6 text-5xl md:text-7xl mb-12">
            Tell us about <em>your car.</em>
          </h2>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="rounded-2xl border border-line bg-charcoal/30 backdrop-blur p-8 md:p-12">
            <BookingProgress step={step} />
            <FormProvider {...methods}>
              <form noValidate onSubmit={onSubmit}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.45, ease: [0.22, 0.7, 0.2, 1] }}
                  >
                    {step === 0 && <BookingStepVehicle />}
                    {step === 1 && <BookingStepWhen />}
                    {step === 2 && (
                      <BookingStepPhotos
                        files={files}
                        onFilesChange={setFiles}
                        filesError={filesError}
                        setFilesError={setFilesError}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {serverError && (
                  <p role="alert" className="mt-6 text-ember text-sm">
                    {serverError}{" "}
                    <a className="underline" href="tel:+12075550100">
                      Or call (207) 555-0100.
                    </a>
                  </p>
                )}

                <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
                  <button
                    type="button"
                    onClick={onBack}
                    disabled={step === 0 || submitState === "submitting"}
                    className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>

                  {step < 2 ? (
                    <button type="button" onClick={onNext} className="btn-primary">
                      Next <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitState === "submitting"}
                      className="btn-primary disabled:opacity-60"
                    >
                      {submitState === "submitting" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Sending…
                        </>
                      ) : (
                        <>Send request <ArrowRight size={16} /></>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </FormProvider>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
