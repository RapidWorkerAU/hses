"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAdmin } from "../lib/adminFetch";
import type { Contact, Organisation } from "./types";

type ContactOrgPickerProps = {
  organisationId: string | null;
  contactId: string | null;
  onOrganisationChange: (orgId: string | null) => void;
  onContactChange: (contactId: string | null) => void;
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
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="qb-combobox">
      <input
        className="qb-input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onInputChange(event.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {isOpen && (
        <div className="qb-combobox-list" role="listbox">
          {items.length === 0 && (
            <div className="qb-combobox-empty">{emptyText}</div>
          )}
          {items.map((item, index) => (
            <div
              key={item.id}
              role="option"
              aria-selected={index === highlighted}
              className={`qb-combobox-option ${index === highlighted ? "is-active" : ""}`}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(item);
                setIsOpen(false);
              }}
              onMouseEnter={() => setHighlighted(index)}
            >
              <div>{item.label}</div>
              {item.subLabel && <div className="qb-combobox-sub">{item.subLabel}</div>}
            </div>
          ))}
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
}: ContactOrgPickerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [orgQuery, setOrgQuery] = useState("");
  const [orgInput, setOrgInput] = useState("");
  const [orgResults, setOrgResults] = useState<Organisation[]>([]);
  const [contactQuery, setContactQuery] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [contactResults, setContactResults] = useState<Contact[]>([]);
  const [orgForm, setOrgForm] = useState({
    name: "",
    abn: "",
    billing_address: "",
    shipping_address: "",
  });
  const [contactForm, setContactForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    organisation_id: "",
  });
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactOrgInput, setContactOrgInput] = useState("");

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
    if (!organisationId) {
      setOrgInput("");
      return;
    }
    const match = orgResults.find((org) => org.id === organisationId);
    if (match) {
      setOrgInput(match.name);
      setOrgQuery(match.name);
    }
  }, [organisationId, orgResults]);

  useEffect(() => {
    if (!contactId) {
      setContactInput("");
      return;
    }
    const match = contactResults.find((contact) => contact.id === contactId);
    if (match) {
      setContactInput(match.full_name);
      setContactQuery(match.full_name);
    }
  }, [contactId, contactResults]);

  const createOrganisation = async () => {
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
  };

  const createContact = async () => {
    const orgId = organisationId || contactForm.organisation_id;
    if (!orgId) return;
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
  };

  const orgItems = useMemo(
    () =>
      orgResults.map((org) => ({
        id: org.id,
        label: org.name,
      })),
    [orgResults]
  );

  const contactItems = useMemo(
    () =>
      contactResults.map((contact) => ({
        id: contact.id,
        label: contact.full_name,
        subLabel: contact.email,
      })),
    [contactResults]
  );

  const handleOrgInput = (value: string) => {
    setOrgInput(value);
    setOrgQuery(value);
    const match = orgResults.find(
      (org) => org.name.trim().toLowerCase() === value.trim().toLowerCase()
    );
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
    if (match) {
      onContactChange(match.id);
    } else {
      onContactChange(null);
    }
  };

  return (
    <div className="qb-panel qb-panel--overflow">
      <div className="qb-panel-header">
        <button
          type="button"
          className="qb-panel-toggle"
          aria-expanded={!isCollapsed}
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          <span>Contacts &amp; Organisation</span>
          <span className="qb-panel-toggle-icon">{isCollapsed ? "+" : "−"}</span>
        </button>
      </div>
      {!isCollapsed && (
        <div className="qb-panel-body">
        <div className="qb-field">
          <label>Organisation</label>
          <div className="qb-field-row">
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
              className="qb-btn qb-btn--fixed"
              onClick={() => {
                setShowOrgModal(true);
                setOrgForm({ name: "", abn: "", billing_address: "", shipping_address: "" });
              }}
            >
              Create new organisation
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="qb-field">
            <label>Contact</label>
            <div className="qb-field-row">
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
                className="qb-btn qb-btn--fixed"
                onClick={() => {
                  setShowContactModal(true);
                  setContactForm({ full_name: "", email: "", phone: "", organisation_id: "" });
                  setContactOrgInput("");
                }}
              >
                Create new contact
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {showOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">New organisation</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                className="qb-input"
                placeholder="Organisation name"
                value={orgForm.name}
                onChange={(event) => setOrgForm({ ...orgForm, name: event.target.value })}
              />
              <input
                className="qb-input"
                placeholder="ABN"
                value={orgForm.abn}
                onChange={(event) => setOrgForm({ ...orgForm, abn: event.target.value })}
              />
              <input
                className="qb-input md:col-span-2"
                placeholder="Billing address"
                value={orgForm.billing_address}
                onChange={(event) =>
                  setOrgForm({ ...orgForm, billing_address: event.target.value })
                }
              />
              <input
                className="qb-input md:col-span-2"
                placeholder="Shipping address"
                value={orgForm.shipping_address}
                onChange={(event) =>
                  setOrgForm({ ...orgForm, shipping_address: event.target.value })
                }
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="qb-btn"
                onClick={() => setShowOrgModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="qb-btn qb-btn-primary"
                onClick={createOrganisation}
                disabled={!orgForm.name.trim()}
              >
                Save organisation
              </button>
            </div>
          </div>
        </div>
      )}

      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">New contact</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {!organisationId && (
                <input
                  className="qb-input md:col-span-2"
                  placeholder="Organisation"
                  value={contactOrgInput}
                  onChange={(event) => {
                    const value = event.target.value;
                    const match = orgResults.find(
                      (org) => org.name.trim().toLowerCase() === value.trim().toLowerCase()
                    );
                    setContactForm({
                      ...contactForm,
                      organisation_id: match ? match.id : "",
                    });
                    setContactOrgInput(value);
                  }}
                />
              )}
              <input
                className="qb-input"
                placeholder="Full name"
                value={contactForm.full_name}
                onChange={(event) =>
                  setContactForm({ ...contactForm, full_name: event.target.value })
                }
              />
              <input
                className="qb-input"
                placeholder="Email"
                value={contactForm.email}
                onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
              />
              <input
                className="qb-input"
                placeholder="Phone (optional)"
                value={contactForm.phone}
                onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })}
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="qb-btn"
                onClick={() => setShowContactModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="qb-btn qb-btn-primary"
                onClick={createContact}
                disabled={
                  !(organisationId || contactForm.organisation_id) ||
                  !contactForm.full_name.trim() ||
                  !contactForm.email.trim()
                }
              >
                Save contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
