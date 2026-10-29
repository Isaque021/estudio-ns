import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Camera } from "lucide-react";

import { GalleryGrid } from "@/components/site/gallery-grid";
import { getGallery } from "@/lib/data";
import { contactLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Galeria",
  description:
    "Fotos dos cortes, barbas e colorações executados no Estúdio NS. Inspire-se e agende o seu.",
};

export default async function GalleryPage() {
  const gallery = await getGallery();

  return (
    <div className="container-page py-16 lg:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Galeria</p>
        <h1 className="display mt-4 text-4xl text-ink-50 sm:text-5xl">
          Trabalhos da cadeira
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-400">
          Inspire-se no degrade, na barba ou no platinum. Cada foto aqui saiu da nossa
          barra e da nossa navalha.
        </p>
      </div>

      <div className="mt-12">
        <GalleryGrid items={gallery} />
      </div>

      <div className="mt-16 grid gap-6 rounded-3xl border border-ink-800 bg-ink-900/50 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Camera className="size-6 text-brand-400" />
          <h2 className="display mt-4 text-2xl text-ink-50">
            Quer o seu corte na galeria?
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-400">
            Marque seu horário, tire a foto na hora e compartilhe. Clientes com o
            trabalho publicado ganham 10% na próxima barbearia.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/agendar" className="btn btn-primary">
            Agendar horário
            <ArrowRight className="size-4" />
          </Link>
          <a
            href={contactLink("Olá! Vi a galeria e gostaria de tirar uma dúvida.")}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
          >
            Enviar referência pelo WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
