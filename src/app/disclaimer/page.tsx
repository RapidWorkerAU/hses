import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website Disclaimer",
};

export default function DisclaimerPage() {
  return (
    <div className="page-stack">
      <header className="site-header">
        <div className="header-inner">
          <div className="header-left">
            <a href="/">
              <img
                src="/images/logo-black.png"
                alt="HSES Industry Partners"
                className="header-logo"
              />
            </a>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary js-open-modal" type="button">
              Book discovery call
            </button>
          </div>
        </div>
      </header>

      <main className="privacy-main">
        <section className="privacy-content">
          <h1>Website Disclaimer</h1>
          <p>
            Welcome to our website. If you continue to browse and use this
            website you are agreeing to comply with and be bound by the
            following disclaimer, together with our terms and conditions of use.
            The information contained in this website is for general information
            purposes only and is provided by www.hses.com.au. While we endeavour
            to keep the information up to date and correct, we make no
            representations or warranties of any kind, express or implied, about
            the completeness, accuracy, reliability, suitability or availability
            with respect to the website or the information, products, services,
            or related graphics contained on the website for any purpose. Any
            reliance you place on such information is therefore strictly at your
            own risk. You need to make your own enquiries to determine if the
            information or products are appropriate for your intended use.
          </p>

          <p>
            In no event will we be liable for any loss or damage including
            without limitation, indirect or consequential loss or damage, or any
            loss or damage whatsoever arising from loss of data or profits
            arising out of, or in connection with, the use of this website.
          </p>

          <p>
            Through this website you may be able to link to other websites which
            are not under the control of www.hses.com.au. We have no control over
            the nature, content and availability of those websites. The
            inclusion of any links does not necessarily imply a recommendation
            or endorse the views expressed within them.
          </p>

          <p>
            Every effort is made to keep the website up and running smoothly.
            However, www.hses.com.au takes no responsibility for, and will not
            be liable for, the website being temporarily unavailable due to
            technical issues beyond our control.
          </p>

          <h2>Copyright notice</h2>
          <p>
            This website and its contents are the copyright of HSES Industry
            Partners © 2023. All rights reserved.
          </p>

          <p>
            Any redistribution or reproduction of part or all of the contents
            in any form is prohibited other than the following. You may print or
            download contents to a local hard disk for your personal and
            non-commercial use only. You may copy some extracts only to
            individual third parties for their personal use, but only if you
            acknowledge the website as the source of the material.
          </p>

          <p>
            You may not, except with our express written permission, distribute
            or commercially exploit the content. You may not transmit it or
            store it on any other website or other form of electronic retrieval
            system.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span className="footer-copy">&copy; 2025 HSES Industry Partners</span>
          <div className="footer-links">
            <a className="footer-link" href="/privacy">
              Privacy Policy
            </a>
            <a className="footer-link" href="/disclaimer">
              Website Disclaimer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}



