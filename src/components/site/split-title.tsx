import { Fragment } from "react";

/**
 * Título principal com hover sequenciado por letra (só em dispositivos
 * com mouse preciso — ver .title-hover em globals.css).
 *
 * Acessibilidade: o texto completo é renderizado por um span sr-only
 * (lido integralmente pelos leitores de tela) e as letras ficam em
 * aria-hidden, sem leitura duplicada letra por letra.
 */
export function SplitTitle({
  text,
  tone = "rose",
}: {
  text: string;
  /** Cor do hover por letra: rosé (padrão), preto (Barbearia), rosa do tema
   * Unhas & Beleza (`beauty`) ou branco/rosé-claro sobre foto escura. */
  tone?: "rose" | "ink" | "beauty" | "dark" | "dark-rose";
}) {
  let letterIndex = 0;

  const toneClass =
    tone === "ink"
      ? "title-hover-ink"
      : tone === "beauty"
        ? "title-hover-beauty"
        : tone === "dark"
          ? "title-hover-dark"
          : tone === "dark-rose"
            ? "title-hover-dark-rose"
            : "";

  return (
    <span
      className={toneClass ? `title-split ${toneClass}` : "title-split"}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="title-hover">
        {text.split(" ").map((word, wordIndex) => (
          <Fragment key={wordIndex}>
            {wordIndex > 0 && " "}
            <span className="inline-block">
              {[...word].map((letter) => (
                <span
                  key={letterIndex}
                  className="title-letter"
                  style={
                    { "--letter-index": letterIndex++ } as React.CSSProperties
                  }
                >
                  {letter}
                </span>
              ))}
            </span>
          </Fragment>
        ))}
      </span>
    </span>
  );
}
