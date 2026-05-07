import Script from "next/script";

type GoogleTagProps = {
  tagId?: string;
};

export default function GoogleTag({ tagId }: GoogleTagProps) {
  if (!tagId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${tagId}');
        `}
      </Script>
    </>
  );
}
