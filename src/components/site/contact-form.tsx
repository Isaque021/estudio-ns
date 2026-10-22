"use client";

import { Send } from "lucide-react";
import { useState } from "react";

import { buildWhatsAppLink } from "@/lib/whatsapp";

export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = [
      `Olá! Meu nome é ${name || "—"}.`,
      phone ? `Meu telefone é ${phone}.` : "",
      "",
      message || "Gostaria de uma informação sobre os serviços da barbearia.",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(buildWhatsAppLink(text), "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6 sm:p-8">
      <div>
        <label htmlFor="contact-name" className="label">
          Seu nome
        </label>
        <input
          id="contact-name"
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Como podemos te chamar?"
        />
      </div>

      <div>
        <label htmlFor="contact-phone" className="label">
          WhatsApp
        </label>
        <input
          id="contact-phone"
          className="input"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="(11) 99999-9999"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="label">
          Mensagem
        </label>
        <textarea
          id="contact-message"
          className="input min-h-28 resize-y"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Conte o que você precisa."
        />
      </div>

      <button type="submit" className="btn btn-whatsapp w-full">
        <Send className="size-4" />
        Enviar pelo WhatsApp
      </button>
      <p className="text-center text-xs text-ink-500">
        Ao enviar, o WhatsApp abre com a mensagem pronta — é só tocar em enviar.
      </p>
    </form>
  );
}
