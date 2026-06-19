"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import ImageUploadField from "@/components/admin/ImageUploadField";
import {
  getTenantProfileAction,
  updateTenantProfileAction,
  type TenantProfile,
} from "../actions";

export default function ModeratorCompanyPage() {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    logoUrl: "",
    contactEmail: "",
    website: "",
    location: "",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getTenantProfileAction();
        setProfile(data);
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          logoUrl: data.logo_url ?? "",
          contactEmail: data.contact_email ?? "",
          website: data.website ?? "",
          location: data.location ?? "",
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load company profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    setSaving(true);
    try {
      await updateTenantProfileAction({
        name: form.name,
        description: form.description,
        logoUrl: form.logoUrl || null,
        contactEmail: form.contactEmail || null,
        website: form.website || null,
        location: form.location || null,
      });
      toast.success("Company profile saved");
      const refreshed = await getTenantProfileAction();
      setProfile(refreshed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="w-8 h-8 text-[#F4C64D]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building2 className="w-7 h-7 text-[#F4C64D]" />
          Company profile
        </h1>
        <p className="text-sm text-[#A0A0B0] mt-2">
          This information appears on the tour marketplace below your published trip
          templates — logo, bio, and contact details for travelers.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-[#322F36] bg-[#322F36]/40 p-6">
        <div>
          <label className="text-sm text-[#A0A0B0] mb-1.5 block">Company name</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="bg-[#1A1D26] border-[#322F36] text-white"
            placeholder="Central Mongolia Travel"
          />
        </div>

        <ImageUploadField
          label="Company logo"
          folder="companies"
          value={form.logoUrl}
          onChange={(logoUrl) => setForm((f) => ({ ...f, logoUrl }))}
        />

        <div>
          <label className="text-sm text-[#A0A0B0] mb-1.5 block">About your company</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={5}
            className="w-full rounded-md border border-[#322F36] bg-[#1A1D26] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4C64D]/40"
            placeholder="Tell travelers about your team, experience, and what makes your journeys special…"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[#A0A0B0] mb-1.5 block">Location / region</label>
            <Input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="bg-[#1A1D26] border-[#322F36] text-white"
              placeholder="Ulaanbaatar, Mongolia"
            />
          </div>
          <div>
            <label className="text-sm text-[#A0A0B0] mb-1.5 block">Contact email</label>
            <Input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              className="bg-[#1A1D26] border-[#322F36] text-white"
              placeholder="hello@company.mn"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-[#A0A0B0] mb-1.5 block">Website</label>
          <Input
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            className="bg-[#1A1D26] border-[#322F36] text-white"
            placeholder="https://centralmongolia.mn"
          />
        </div>

        {profile && (
          <p className="text-xs text-[#A0A0B0]">
            Last updated profile for marketplace display. Assign moderators from the Admin
            panel if your team changes.
          </p>
        )}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto bg-[#F4C64D] text-[#1A1D26] font-bold hover:bg-[#F4C64D]/90"
        >
          {saving ? (
            <Spinner className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save company profile
        </Button>
      </div>
    </div>
  );
}
