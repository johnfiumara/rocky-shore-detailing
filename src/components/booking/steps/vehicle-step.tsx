"use client";

import { useFormContext } from "react-hook-form";
import { services } from "@/data/services";
import { FormField, Input, RadioCard } from "@/components/ui";
import type { BookingInput } from "@/lib/booking-schema";

export function VehicleStep() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<BookingInput>();

  const selectedService = watch("service");

  return (
    <div className="space-y-10">
      <fieldset>
        <legend className="font-display text-2xl md:text-3xl text-bone mb-6">
          Choose a service
        </legend>
        <div
          role="radiogroup"
          aria-label="Service"
          className="grid gap-3 md:grid-cols-2"
        >
          {services.map((s) => (
            <RadioCard
              key={s.slug}
              name="service"
              value={s.slug}
              checked={selectedService === s.slug}
              onChange={() =>
                setValue("service", s.slug as BookingInput["service"], {
                  shouldValidate: true,
                })
              }
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display text-xl text-bone">
                  {s.title}
                </span>
                <span className="font-mono-accent text-[10px] tracking-[0.2em] uppercase text-bronze">
                  From ${s.tiers[0].price}
                </span>
              </div>
            </RadioCard>
          ))}
        </div>
        {errors.service && (
          <p role="alert" className="mt-4 text-[12px] text-ember">
            {errors.service.message}
          </p>
        )}
      </fieldset>

      <fieldset className="grid gap-5 md:grid-cols-4">
        <legend className="sr-only">Vehicle details</legend>
        <FormField
          label="Year"
          error={errors.year?.message}
          htmlFor="booking-year"
        >
          <Input
            id="booking-year"
            type="number"
            inputMode="numeric"
            placeholder="2021"
            error={!!errors.year}
            {...register("year")}
          />
        </FormField>
        <FormField
          label="Make"
          error={errors.make?.message}
          htmlFor="booking-make"
        >
          <Input
            id="booking-make"
            type="text"
            placeholder="Subaru"
            error={!!errors.make}
            {...register("make")}
          />
        </FormField>
        <FormField
          label="Model"
          error={errors.model?.message}
          htmlFor="booking-model"
        >
          <Input
            id="booking-model"
            type="text"
            placeholder="Outback"
            error={!!errors.model}
            {...register("model")}
          />
        </FormField>
        <FormField
          label="Color"
          error={errors.color?.message}
          htmlFor="booking-color"
        >
          <Input
            id="booking-color"
            type="text"
            placeholder="Magnetite Gray"
            error={!!errors.color}
            {...register("color")}
          />
        </FormField>
      </fieldset>
    </div>
  );
}
