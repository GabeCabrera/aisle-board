"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Calendar, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface FormFields {
  name?: boolean;
  email?: boolean;
  phone?: boolean;
  address?: boolean;
  attending?: boolean;
  mealChoice?: boolean;
  dietaryRestrictions?: boolean;
  plusOne?: boolean;
  plusOneName?: boolean;
  plusOneMeal?: boolean;
  songRequest?: boolean;
  notes?: boolean;
}

interface RsvpFormConfig {
  title: string;
  message: string | null;
  weddingDate: string | null;
  coupleNames: string | null;
  fields: FormFields;
  mealOptions: string[];
}

export default function RsvpPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [formConfig, setFormConfig] = useState<RsvpFormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
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

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/rsvp/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("This RSVP link is not valid or has expired.");
          } else {
            setError("Failed to load RSVP form.");
          }
          return;
        }
        const data = await res.json();
        setFormConfig(data);
      } catch {
        setError("Failed to load RSVP form.");
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/rsvp/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit RSVP");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit RSVP");
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
      </div>
    );
  }

  if (error && !formConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-xl font-serif text-gray-900 mb-2">Oops!</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-4">
              Your RSVP has been received. {formConfig?.coupleNames ? `${formConfig.coupleNames} can't wait to celebrate with you!` : "We can't wait to celebrate with you!"}
            </p>
            <Heart className="h-6 w-6 text-rose-400 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const fields = formConfig?.fields || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Heart className="h-10 w-10 text-rose-400 mx-auto mb-4" />
          {formConfig?.coupleNames && (
            <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">
              {formConfig.coupleNames}
            </h1>
          )}
          <h2 className="text-xl text-gray-600 font-light">
            {formConfig?.title || "RSVP"}
          </h2>
          {formConfig?.weddingDate && (
            <div className="flex items-center justify-center gap-2 mt-3 text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(formConfig.weddingDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {formConfig?.message && (
          <p className="text-center text-gray-600 mb-8 italic">
            {formConfig.message}
          </p>
        )}

        {/* Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Please respond</CardTitle>
            <CardDescription>We would be honored to have you join us</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name - always shown */}
              <div className="space-y-2">
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Email */}
              {fields.email && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
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
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(555) 555-5555"
                  />
                </div>
              )}

              {/* Address */}
              {fields.address && (
                <div className="space-y-2">
                  <Label htmlFor="address">Mailing Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Street address, City, State, ZIP"
                    rows={2}
                  />
                </div>
              )}

              {/* Attending */}
              {fields.attending && (
                <div className="space-y-3">
                  <Label>Will you be attending? *</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="attending"
                        checked={formData.attending === true}
                        onChange={() => updateField("attending", true)}
                        className="w-4 h-4 text-rose-500 focus:ring-rose-400"
                      />
                      <span className="text-sm">Joyfully accepts</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="attending"
                        checked={formData.attending === false}
                        onChange={() => updateField("attending", false)}
                        className="w-4 h-4 text-rose-500 focus:ring-rose-400"
                      />
                      <span className="text-sm">Regretfully declines</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Meal Choice */}
              {fields.mealChoice && formConfig?.mealOptions && formConfig.mealOptions.length > 0 && (
                <div className="space-y-3">
                  <Label>Meal Preference</Label>
                  <div className="space-y-2">
                    {formConfig.mealOptions.map((option) => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mealChoice"
                          value={option}
                          checked={formData.mealChoice === option}
                          onChange={(e) => updateField("mealChoice", e.target.value)}
                          className="w-4 h-4 text-rose-500 focus:ring-rose-400"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary Restrictions */}
              {fields.dietaryRestrictions && (
                <div className="space-y-2">
                  <Label htmlFor="dietary">Dietary Restrictions or Allergies</Label>
                  <Input
                    id="dietary"
                    value={formData.dietaryRestrictions}
                    onChange={(e) => updateField("dietaryRestrictions", e.target.value)}
                    placeholder="e.g., vegetarian, gluten-free, nut allergy"
                  />
                </div>
              )}

              {/* Plus One */}
              {fields.plusOne && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.plusOne}
                      onChange={(e) => updateField("plusOne", e.target.checked)}
                      className="w-4 h-4 text-rose-500 focus:ring-rose-400 rounded"
                    />
                    <span className="text-sm">I will be bringing a guest</span>
                  </label>

                  {formData.plusOne && fields.plusOneName && (
                    <div className="space-y-2">
                      <Label htmlFor="plusOneName">Guest Name</Label>
                      <Input
                        id="plusOneName"
                        value={formData.plusOneName}
                        onChange={(e) => updateField("plusOneName", e.target.value)}
                        placeholder="Guest's full name"
                      />
                    </div>
                  )}

                  {formData.plusOne && fields.plusOneMeal && formConfig?.mealOptions && formConfig.mealOptions.length > 0 && (
                    <div className="space-y-3">
                      <Label>Guest Meal Preference</Label>
                      <div className="space-y-2">
                        {formConfig.mealOptions.map((option) => (
                          <label key={`plus-${option}`} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="plusOneMeal"
                              value={option}
                              checked={formData.plusOneMeal === option}
                              onChange={(e) => updateField("plusOneMeal", e.target.value)}
                              className="w-4 h-4 text-rose-500 focus:ring-rose-400"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Song Request */}
              {fields.songRequest && (
                <div className="space-y-2">
                  <Label htmlFor="song">Song Request</Label>
                  <Input
                    id="song"
                    value={formData.songRequest}
                    onChange={(e) => updateField("songRequest", e.target.value)}
                    placeholder="What song will get you on the dance floor?"
                  />
                </div>
              )}

              {/* Notes */}
              {fields.notes && (
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Anything else you'd like us to know?"
                    rows={3}
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600"
                disabled={submitting || !formData.name}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit RSVP"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-400 text-sm mt-8">
          Powered by Scribe & Stem
        </p>
      </div>
    </div>
  );
}
