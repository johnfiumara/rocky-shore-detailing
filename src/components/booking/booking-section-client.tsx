"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import type { CustomerSummary, RebookPayload, VehicleSummary } from "./types";

type BookingFormInput = z.input<typeof bookingSchema>;

type Step = 0 | 1 | 2;

const STEP_FIELDS: Record<Step, (keyof BookingFormInput)[]> = {
  0: ["service", "year", "make", "model", "color"],
  1: ["address", "city", "zip", "date", "timeWindow"],
  2: ["name", "email", "phone", "notes"],
};

export function BookingSectionClient({
  customer,
  vehicles,
  rebook,
}: {
  customer: CustomerSummary | null;
  vehicles: VehicleSummary[];
  rebook: RebookPayload | null;
}) {
  const isSignedIn = !!customer;

  const defaultVehicleId = useMemo(() => {
    if (rebook?.vehicle) {
      const saved = vehicles.find((v) => v.id === rebook.vehicle.id);
      if (saved) return saved.id;
      return "new";
    }
    const def = vehicles.find((v) => v.isDefault);
    return def?.id ?? (vehicles[0]?.id || "new");
  }, [vehicles, rebook]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | "new">(
    defaultVehicleId,
  );

  const defaultValues: BookingFormInput = useMemo(() => {
    const service =
      rebook?.serviceSlug &&
      (SERVICE_SLUGS as readonly string[]).includes(rebook.serviceSlug)
        ? rebook.serviceSlug
        : "full-package";

    return {
      service: service as BookingFormInput["service"],
      year: rebook?.vehicle?.year ?? undefined,
      make: rebook?.vehicle?.make ?? "",
      model: rebook?.vehicle?.model ?? "",
      color: rebook?.vehicle?.color ?? "",
      address: customer?.address ?? "",
      city: customer?.city ?? "",
      zip: customer?.zip ?? "",
      date: "",
      timeWindow: "morning",
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      notes: "",
    };
  }, [customer, rebook]);

  const methods = useForm<BookingFormInput, unknown, BookingInput>({
    resolver: zodResolver(bookingSchema),
    mode: "onTouched",
    defaultValues,
  });

  useEffect(() => {
    methods.reset(defaultValues);
  }, [defaultValues, methods]);

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
      setSubmitState("error");
      setServerError(
        body?.error === "validation"
          ? "Some fields need fixing."
          : "Couldn't send right now.",
      );
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
                    {step === 0 && (
                      <VehicleStep
                        vehicles={vehicles}
                        selectedId={selectedVehicleId}
                        onSelect={setSelectedVehicleId}
                        isSignedIn={isSignedIn}
                      />
                    )}
                    {step === 1 && <WhenStep />}
                    {step === 2 && (
                      <PhotosStep
                        files={files}
                        onFilesChange={setFiles}
                        filesError={filesError}
                        setFilesError={setFilesError}
                        isSignedIn={isSignedIn}
                        customer={customer}
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
