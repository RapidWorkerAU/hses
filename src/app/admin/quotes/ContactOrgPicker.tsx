"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAdmin } from "../lib/adminFetch";
import type { Contact, Organisation } from "./types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type ContactOrgPickerProps = {
  organisationId: string | null;
  contactId: string | null;
  onOrganisationChange: (orgId: string | null) => void;
  onContactChange: (contactId: string | null) => void;
  embedded?: boolean;
  inline?: boolean;
};

type ComboItem = {
  id: string;
  label: string;
  subLabel?: string;
};


type ComboboxProps = {
  value: string;
  placeholder: string;
  items: ComboItem[];
  emptyText: string;
  onInputChange: (value: string) => void;
  onSelect: (item: ComboItem) => void;
};

function Combobox({ value, placeholder, items, emptyText, onInputChange, onSelect }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setHighlighted(0);
  }, [isOpen, items.length]);

  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => setIsOpen(false), 120);
  };

  const handleFocus = () => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
    setIsOpen(true);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((prev) => (items.length ? (prev + 1) % items.length : 0));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((prev) => (items.length ? (prev - 1 + items.length) % items.length : 0));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (items[highlighted]) {
        onSelect(items[highlighted]);
        setIsOpen(false);
      }
    }
    if (event.key === "Escape") setIsOpen(false);
  };

  return (
    <div className="relative flex-1 min-w-0">
      <input
        className="h-[40px] w-full rounded-md border border-neutral-200 bg-white px-3 text-[14px] text-neutral-900 outline-none transition-colors duration-150 hover:border-neutral-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 placeholder:text-neutral-400"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onInputChange(event.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden" role="listbox">
          {items.length === 0 ? (
            <div className="px-3 py-3 text-center text-[13px] text-neutral-400">{emptyText}</div>
          ) : (
            <div className="max-h-52 overflow-y-auto">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={index === highlighted}
                  className={cn(
                    "px-3 py-2 cursor-pointer transition-colors",
                    index === highlighted ? "bg-accent-500/10 text-accent-500" : "hover:bg-neutral-50"
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onSelect(item);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlighted(index)}
                >
                  <div className="text-[13px] font-medium text-neutral-900">{item.label}</div>
                  {item.subLabel && (
                    <div className="text-[12px] text-neutral-500 mt-0.5">{item.subLabel}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ContactOrgPicker({
  organisationId,
  contactId,
  onOrganisationChange,
  onContactChange,
  embedded = false,
  inline = false,
}: ContactOrgPickerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [orgQuery, setOrgQuery] = useState("");
  const [orgInput, setOrgInput] = useState("");
  const [orgResults, setOrgResults] = useState<Organisation[]>([]);
  const [contactQuery, setContactQuery] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [contactResults, setContactResults] = useState<Contact[]>([]);
  const [orgForm, setOrgForm] = useState({ name: "", abn: "", billing_address: "", shipping_address: "" });
  const [contactForm, setContactForm] = useState({ full_name: "", email: "", phone: "", organisation_id: "" });
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactOrgInput, setContactOrgInput] = useState("");
  const [isCreatingOrganisation, setIsCreatingOrganisation] = useState(false);
  const [isCreatingContact, setIsCreatingContact] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await fetchAdmin(
        `/api/admin/organisations?query=${encodeURIComponent(orgQuery)}&limit=500`
      );
      if (response.ok) {
        const data = (await response.json()) as { organisations: Organisation[] };
        setOrgResults(data.organisations ?? []);
      }
    };
    load();
  }, [orgQuery]);

  useEffect(() => {
    const load = async () => {
      const orgParam = organisationId ? `&organisationId=${organisationId}` : "";
      const response = await fetchAdmin(
        `/api/admin/contacts?query=${encodeURIComponent(contactQuery)}${orgParam}&limit=500`
      );
      if (response.ok) {
        const data = (await response.json()) as { contacts: Contact[] };
        setContactResults(data.contacts ?? []);
      }
    };
    load();
  }, [contactQuery, organisationId]);

  useEffect(() => {
    if (!organisationId) { setOrgInput(""); return; }
    const match = orgResults.find((org) => org.id === organisationId);
    if (match) { setOrgInput(match.name); setOrgQuery(match.name); }
  }, [organisationId, orgResults]);

  useEffect(() => {
    if (!contactId) { setContactInput(""); return; }
    const match = contactResults.find((contact) => contact.id === contactId);
    if (match) { setContactInput(match.full_name); setContactQuery(match.full_name); }
  }, [contactId, contactResults]);

  const createOrganisation = async () => {
    if (isCreatingOrganisation) return;
    setIsCreatingOrganisation(true);
    try {
      const response = await fetchAdmin("/api/admin/organisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgForm),
      });
      if (response.ok) {
        const data = (await response.json()) as { organisation: Organisation };
        onOrganisationChange(data.organisation.id);
        setOrgInput(data.organisation.name);
        setOrgQuery(data.organisation.name);
        setShowOrgModal(false);
      }
    } finally {
      setIsCreatingOrganisation(false);
    }
  };

  const createContact = async () => {
    const orgId = organisationId || contactForm.organisation_id;
    if (!orgId || isCreatingContact) return;
    setIsCreatingContact(true);
    try {
      const response = await fetchAdmin("/api/admin/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contactForm, organisation_id: orgId }),
      });
      if (response.ok) {
        const data = (await response.json()) as { contact: Contact };
        onContactChange(data.contact.id);
        setContactInput(data.contact.full_name);
        setContactQuery(data.contact.full_name);
        setShowContactModal(false);
        setContactOrgInput("");
      }
    } finally {
      setIsCreatingContact(false);
    }
  };

  const orgItems = useMemo(() => orgResults.map((org) => ({ id: org.id, label: org.name })), [orgResults]);
  const contactItems = useMemo(
    () => contactResults.map((contact) => ({ id: contact.id, label: contact.full_name, subLabel: contact.email })),
    [contactResults]
  );

  const handleOrgInput = (value: string) => {
    setOrgInput(value);
    setOrgQuery(value);
    const match = orgResults.find((org) => org.name.trim().toLowerCase() === value.trim().toLowerCase());
    if (match) {
      onOrganisationChange(match.id);
      onContactChange(null);
      setContactInput("");
      setContactQuery("");
    } else {
      onOrganisationChange(null);
      onContactChange(null);
      setContactInput("");
      setContactQuery("");
    }
  };

  const handleContactInput = (value: string) => {
    setContactInput(value);
    setContactQuery(value);
    const match = contactResults.find(
      (contact) => contact.full_name.trim().toLowerCase() === value.trim().toLowerCase()
    );
    if (match) onContactChange(match.id);
    else onContactChange(null);
  };

  const pickerFields = (
    <div className={cn("grid gap-4", inline ? "md:grid-cols-2" : "")}>
      <div>
        <label className="block text-[13px] font-medium text-neutral-900 mb-[5px]">Organisation</label>
        <div className="flex gap-2">
          <Combobox
            value={orgInput}
            placeholder="Select organisation..."
            items={orgItems}
            emptyText="No organisations found."
            onInputChange={handleOrgInput}
            onSelect={(item) => {
              onOrganisationChange(item.id);
              setOrgInput(item.label);
              setOrgQuery(item.label);
              onContactChange(null);
              setContactInput("");
              setContactQuery("");
            }}
          />
          <button
            type="button"
            className="flex-shrink-0 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[12px] font-medium text-neutral-600 transition hover:bg-neutral-50 whitespace-nowrap"
            onClick={() => {
              setShowOrgModal(true);
              setOrgForm({ name: "", abn: "", billing_address: "", shipping_address: "" });
            }}
          >
            + New
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[13px] font-medium text-neutral-900 mb-[5px]">Contact</label>
        <div className="flex gap-2">
          <Combobox
            value={contactInput}
            placeholder={organisationId ? "Select contact..." : "Select contact (all)"}
            items={contactItems}
            emptyText="No contacts found."
            onInputChange={handleContactInput}
            onSelect={(item) => {
              onContactChange(item.id);
              setContactInput(item.label);
              setContactQuery(item.label);
            }}
          />
          <button
            type="button"
            className="flex-shrink-0 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[12px] font-medium text-neutral-600 transition hover:bg-neutral-50 whitespace-nowrap"
            onClick={() => {
              setShowContactModal(true);
              setContactForm({ full_name: "", email: "", phone: "", organisation_id: "" });
              setContactOrgInput("");
            }}
          >
            + New
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {embedded ? (
        pickerFields
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-medium text-neutral-900 hover:bg-neutral-50 transition"
            aria-expanded={!isCollapsed}
            onClick={() => setIsCollapsed((prev) => !prev)}
          >
            <span>Contacts &amp; Organisation</span>
            <span className="text-neutral-400 text-[16px] leading-none">{isCollapsed ? "+" : "−"}</span>
          </button>
          {!isCollapsed && <div className="p-4 border-t border-neutral-100">{pickerFields}</div>}
        </div>
      )}

      {showOrgModal && (
        <Modal
          open={showOrgModal}
          title="Create new organisation"
          onClose={() => setShowOrgModal(false)}
          size="lg"
          footer={
            <>
              <Button variant="neutral" onClick={() => setShowOrgModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={createOrganisation}
                disabled={!orgForm.name.trim() || isCreatingOrganisation}
                loading={isCreatingOrganisation}
                loadingText="Saving..."
              >
                Save organisation
              </Button>
            </>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Organisation name" value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
            <Input placeholder="ABN" value={orgForm.abn} onChange={(e) => setOrgForm({ ...orgForm, abn: e.target.value })} />
            <Input containerClassName="md:col-span-2" placeholder="Billing address" value={orgForm.billing_address} onChange={(e) => setOrgForm({ ...orgForm, billing_address: e.target.value })} />
            <Input containerClassName="md:col-span-2" placeholder="Shipping address" value={orgForm.shipping_address} onChange={(e) => setOrgForm({ ...orgForm, shipping_address: e.target.value })} />
          </div>
        </Modal>
      )}

      {showContactModal && (
        <Modal
          open={showContactModal}
          title="Create new contact"
          onClose={() => setShowContactModal(false)}
          size="lg"
          footer={
            <>
              <Button variant="neutral" onClick={() => setShowContactModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={createContact}
                disabled={isCreatingContact || !(organisationId || contactForm.organisation_id) || !contactForm.full_name.trim() || !contactForm.email.trim()}
                loading={isCreatingContact}
                loadingText="Saving..."
              >
                Save contact
              </Button>
            </>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            {!organisationId && (
              <Input
                containerClassName="md:col-span-2"
                placeholder="Organisation"
                value={contactOrgInput}
                onChange={(e) => {
                  const value = e.target.value;
                  const match = orgResults.find((org) => org.name.trim().toLowerCase() === value.trim().toLowerCase());
                  setContactForm({ ...contactForm, organisation_id: match ? match.id : "" });
                  setContactOrgInput(value);
                }}
              />
            )}
            <Input placeholder="Full name" value={contactForm.full_name} onChange={(e) => setContactForm({ ...contactForm, full_name: e.target.value })} />
            <Input placeholder="Email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
            <Input placeholder="Phone (optional)" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
          </div>
        </Modal>
      )}
    </>
  );
}
