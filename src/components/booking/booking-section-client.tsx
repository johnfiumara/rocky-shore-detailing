"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import {
  type BookingInput,
  bookingSchema,
  SERVICE_SLUGS,
} from "@/lib/booking-schema";
import { Button } from "@/components/ui";
import BookingProgress from "@/components/booking/booking-progress";
import BookingSuccess from "@/components/booking/booking-success";
import { VehicleStep } from "@/components/booking/steps/vehicle-step";
import { WhenStep } from "@/components/booking/steps/when-step";
import { PhotosStep } from "@/components/booking/steps/photos-step";
import Reveal from "@/components/reveal";

type BookingFormInput = z.input<typeof bookingSchema>;

type Step = 0 | 1 | 2;

const STEP_FIELDS: Record<Step, (keyof BookingFormInput)[]> = {
  0: ["service", "year", "make", "model", "color"],
  1: ["address", "city", "zip", "date", "timeWindow"],
  2: ["name", "email", "phone", "notes"],
};

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "";

const DEFAULT_VALUES: BookingFormInput = {
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
};

export function BookingSectionClient() {
  const methods = useForm<BookingFormInput, unknown, BookingInput>({
    resolver: zodResolver(bookingSchema),
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

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

  const [step, setStep] = useState<Step>(0);
  const [files, setFiles] = useState<File[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "ok" | "error"
  >("idle");
  const [submittedName, setSubmittedName] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const onNext = async () => {
    const ok = await methods.trigger(STEP_FIELDS[step]);
    if (ok) setStep((s) => Math.min(2, s + 1) as Step);
  };
  const onBack = () => setStep((s) => Math.max(0, s - 1) as Step);

  const onSubmit = methods.handleSubmit(async (data) => {
    if (!WEB3FORMS_KEY) {
      setSubmitState("error");
      setServerError(
        "Booking form isn't configured yet. Please call or email — see footer.",
      );
      return;
    }

    setSubmitState("submitting");
    setServerError(null);

    const fd = new FormData();
    // Web3Forms metadata fields.
    fd.append("access_key", WEB3FORMS_KEY);
    fd.append("subject", `New booking request — ${data.name}`);
    fd.append("from_name", "Rocky Coast Detailing booking form");
    fd.append("replyto", data.email);

    (Object.entries(data) as [string, unknown][]).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    files.forEach((f) => fd.append(`photo_${f.name}`, f));

    try {
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        body: fd,
      });
      const body = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
      if (res.ok && body.success !== false) {
        setSubmittedName(data.name);
        setSubmitState("ok");
        return;
      }
      setSubmitState("error");
      setServerError(body.message ?? "Couldn't send right now.");
    } catch {
      setSubmitState("error");
      setServerError("Network issue — please try again or call.");
    }
  });

  if (submitState === "ok") {
    return (
      <section
        id="book"
        className="relative py-32 md:py-44 border-t border-line"
      >
        <div className="mx-auto max-w-3xl px-6">
          <BookingSuccess name={submittedName} />
        </div>
      </section>
    );
  }

  return (
    <section
      id="book"
      aria-labelledby="book-h"
      className="relative py-32 md:py-44 border-t border-line"
    >
      <div className="mx-auto max-w-4xl px-6">
        <Reveal>
          <p className="eyebrow">Book a detail</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2
            id="book-h"
            className="headline mt-6 text-5xl md:text-7xl mb-12"
          >
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
                    transition={{
                      duration: 0.45,
                      ease: [0.22, 0.7, 0.2, 1],
                    }}
                  >
                    {step === 0 && <VehicleStep />}
                    {step === 1 && <WhenStep />}
                    {step === 2 && (
                      <PhotosStep
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    disabled={step === 0 || submitState === "submitting"}
                  >
                    <ArrowLeft size={16} /> Back
                  </Button>

                  {step < 2 ? (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={onNext}
                    >
                      Next <ArrowRight size={16} />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={submitState === "submitting"}
                    >
                      Send request <ArrowRight size={16} />
                    </Button>
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
