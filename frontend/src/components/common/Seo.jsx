import React from "react";
import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://soleserenity.co.uk";
const SITE_NAME = "Sole Serenity";

const DEFAULT_DESCRIPTION =
  "Premium UK shoe & sneaker cleaning, delivered to your door. Book a Quick or Deep Clean, post your trainers with tracked UK delivery, and we assess your shoes from photos before you pay.";
const DEFAULT_KEYWORDS =
  "shoe cleaning UK, sneaker cleaning UK, trainer cleaning, professional shoe cleaning, sneaker restoration, trainer cleaning service, shoe cleaning delivery, mail in sneaker cleaning";

export function Seo({
  title,
  fullTitle,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  path = "",
  noindex = false,
  jsonLd,
}) {
  const resolvedTitle = fullTitle
    ? fullTitle
    : title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Professional Shoe Cleaning, Delivered`;
  const canonical = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{resolvedTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={canonical} />
      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
}
