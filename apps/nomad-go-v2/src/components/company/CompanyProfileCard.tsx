import { Building2, Globe, Mail, MapPin } from "lucide-react";
import type { MarketplaceCompany } from "@/app/actions/gameActions";

export function CompanyProfileCard({
  company,
  compact = false,
}: {
  company: MarketplaceCompany;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#322F36] bg-[#252830] ${
        compact ? "p-4" : "p-6"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-14 h-14 rounded-xl bg-[#1A1D26] border border-[#322F36] overflow-hidden flex items-center justify-center">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="w-6 h-6 text-[#A0A0B0]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`font-bold text-white ${compact ? "text-base" : "text-lg"}`}>
            {company.name}
          </h3>
          {company.location && (
            <p className="flex items-center gap-1.5 text-xs text-[#A0A0B0] mt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{company.location}</span>
            </p>
          )}
          {!compact && company.description && (
            <p className="text-sm text-[#A0A0B0] mt-3 line-clamp-4 whitespace-pre-line">
              {company.description}
            </p>
          )}
          {!compact && (company.website || company.contactEmail) && (
            <div className="flex flex-wrap gap-3 mt-4 text-xs">
              {company.website && (
                <a
                  href={
                    company.website.startsWith("http")
                      ? company.website
                      : `https://${company.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#F4C64D] hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Website
                </a>
              )}
              {company.contactEmail && (
                <a
                  href={`mailto:${company.contactEmail}`}
                  className="inline-flex items-center gap-1 text-[#A0A0B0] hover:text-white"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {company.contactEmail}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CompanyOperatorRow({
  company,
}: {
  company: MarketplaceCompany | null | undefined;
}) {
  if (!company?.name) return null;

  return (
    <div className="flex items-center gap-2 pt-3 mt-3 border-t border-[#322F36]">
      <div className="w-7 h-7 rounded-lg bg-[#1A1D26] border border-[#322F36] overflow-hidden flex items-center justify-center shrink-0">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Building2 className="w-3.5 h-3.5 text-[#A0A0B0]" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-[#A0A0B0]">
          Operated by
        </p>
        <p className="text-xs font-semibold text-white truncate">{company.name}</p>
      </div>
    </div>
  );
}
