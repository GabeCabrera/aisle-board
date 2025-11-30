"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Heart, Check, Calendar, Mail } from "lucide-react";
import { toast } from "sonner";
import type { RsvpForm } from "@/lib/db/schema";

interface RsvpFormClientProps {
  form: RsvpForm;
  coupleNames: string;
  weddingDate?: string;
}

interface FormFields {
  name: boolean;
  email: boolean;
  phone: boolean;
  address: boolean;
  attending: boolean;
  mealChoice: boolean;
  dietaryRestrictions: boolean;
  plusOne: boolean;
  plusOneName: boolean;
  plusOneMeal: boolean;
  songRequest: boolean;
  notes: boolean;
}

export function RsvpFormClient({ form, coupleNames, weddingDate }: RsvpFormClientProps) {
  const fields = form.fields as FormFields;
  const mealOptions = (form.mealOptions as string[]) || [];
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    attending: null as boolean | null,
    mealChoice: "",
    dietaryRestrictions: "",
    plusOne: false,
    plusOneName: "",
    plusOneMeal: "",
    songRequest: "",
    notes: "",
  });

  const updateField = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Please enter your name");
      return;
    }

    if (fields.attending && formData.attending === null) {
      toast.error("Please let us know if you'll be attending");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/rsvp/${form.slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      setIsSubmitted(true);
      toast.success("Thank you!");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-warm-50 to-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-warm-500" />
          </div>
          <h1 className="text-3xl font-serif font-light tracking-wide mb-4">
            You&apos;re All Set!
          </h1>
          <p className="text-warm-600 mb-2">
            Thanks for sending your details.
          </p>
          <p className="text-warm-500 text-sm">
            {formData.attending 
              ? `${coupleNames} can't wait to celebrate with you!`
              : `${coupleNames} appreciate you letting them know.`
            }
          </p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-warm-50 to-white py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Mail className="w-8 h-8 text-warm-400 mx-auto mb-6" />
          
          <p className="text-sm tracking-[0.3em] uppercase text-warm-500 mb-3">
            {coupleNames}
          </p>
          
          <h1 className="text-4xl font-serif font-light tracking-wide mb-2">
            We Need Your Address
          </h1>
          
          <p className="text-warm-500 mt-4">
            So we can send you something special
          </p>
          
          {weddingDate && (
            <div className="flex items-center justify-center gap-2 text-warm-400 mt-4">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{formatDate(weddingDate)}</span>
            </div>
          )}
          
          {form.message && (
            <p className="mt-6 text-warm-600 italic">
              {form.message}
            </p>
          )}
          
          <div className="w-16 h-px bg-warm-300 mx-auto mt-8" />
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white shadow-lg p-8 space-y-6"
        >
          {/* Name - always shown */}
          {fields.name && (
            <div className="space-y-2">
              <Label>Your Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          {/* Email */}
          {fields.email && (
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="your@email.com"
              />
            </div>
          )}

          {/* Phone */}
          {fields.phone && (
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          )}

          {/* Address */}
          {fields.address && (
            <div className="space-y-2">
              <Label>Mailing Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="123 Main St&#10;City, State 12345"
                rows={3}
              />
            </div>
          )}

          {/* Attending */}
          {fields.attending && (
            <div className="space-y-3">
              <Label>Will you be attending? *</Label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => updateField("attending", true)}
                  className={`flex-1 py-3 px-4 border-2 transition-all ${
                    formData.attending === true
                      ? "border-warm-500 bg-warm-50 text-warm-700"
                      : "border-warm-200 hover:border-warm-300"
                  }`}
                >
                  Joyfully Accept
                </button>
                <button
                  type="button"
                  onClick={() => updateField("attending", false)}
                  className={`flex-1 py-3 px-4 border-2 transition-all ${
                    formData.attending === false
                      ? "border-warm-500 bg-warm-50 text-warm-700"
                      : "border-warm-200 hover:border-warm-300"
                  }`}
                >
                  Regretfully Decline
                </button>
              </div>
            </div>
          )}

          {/* Only show these if attending */}
          {formData.attending !== false && (
            <>
              {/* Meal Choice */}
              {fields.mealChoice && mealOptions.length > 0 && (
                <div className="space-y-2">
                  <Label>Meal Preference</Label>
                  <select
                    value={formData.mealChoice}
                    onChange={(e) => updateField("mealChoice", e.target.value)}
                    className="w-full px-3 py-2 border border-warm-300 text-sm focus:outline-none focus:border-warm-500 bg-white"
                  >
                    <option value="">Select a meal option</option>
                    {mealOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dietary Restrictions */}
              {fields.dietaryRestrictions && (
                <div className="space-y-2">
                  <Label>Dietary Restrictions</Label>
                  <Input
                    value={formData.dietaryRestrictions}
                    onChange={(e) => updateField("dietaryRestrictions", e.target.value)}
                    placeholder="Vegetarian, gluten-free, allergies, etc."
                  />
                </div>
              )}

              {/* Plus One */}
              {fields.plusOne && (
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.plusOne}
                      onChange={(e) => updateField("plusOne", e.target.checked)}
                      className="w-4 h-4 border border-warm-400 accent-warm-500"
                    />
                    <span>I&apos;ll be bringing a guest</span>
                  </label>

                  {formData.plusOne && fields.plusOneName && (
                    <div className="space-y-2 pl-7">
                      <Label>Guest Name</Label>
                      <Input
                        value={formData.plusOneName}
                        onChange={(e) => updateField("plusOneName", e.target.value)}
                        placeholder="Guest's full name"
                      />
                    </div>
                  )}

                  {formData.plusOne && fields.plusOneMeal && mealOptions.length > 0 && (
                    <div className="space-y-2 pl-7">
                      <Label>Guest Meal Preference</Label>
                      <select
                        value={formData.plusOneMeal}
                        onChange={(e) => updateField("plusOneMeal", e.target.value)}
                        className="w-full px-3 py-2 border border-warm-300 text-sm focus:outline-none focus:border-warm-500 bg-white"
                      >
                        <option value="">Select a meal option</option>
                        {mealOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Song Request */}
              {fields.songRequest && (
                <div className="space-y-2">
                  <Label>Song Request</Label>
                  <Input
                    value={formData.songRequest}
                    onChange={(e) => updateField("songRequest", e.target.value)}
                    placeholder="What song will get you on the dance floor?"
                  />
                </div>
              )}
            </>
          )}

          {/* Notes - always available */}
          {fields.notes && (
            <div className="space-y-2">
              <Label>Anything Else?</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Notes, well-wishes, or anything you'd like us to know"
                rows={3}
              />
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-warm-600 hover:bg-warm-700 text-white py-3"
          >
            {isSubmitting ? "Sending..." : "Send My Details"}
          </Button>
        </motion.form>

        {/* Footer */}
        <p className="text-center text-xs text-warm-400 mt-8">
          Made with love using Aisle
        </p>
      </div>
    </main>
  );
}
