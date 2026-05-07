import Script from "next/script";

export const GOOGLE_TAG_ID = "AW-17868932250";

type GoogleTagProps = {
  tagId?: string;
};

export default function GoogleTag({ tagId = GOOGLE_TAG_ID }: GoogleTagProps) {
  const resolvedTagId = tagId?.trim();
  if (!resolvedTagId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${resolvedTagId}`}
        strategy="beforeInteractive"
      />
      <Script id="google-tag" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${resolvedTagId}');
        `}
      </Script>
    </>
  );
}
