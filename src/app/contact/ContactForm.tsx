type ContactFormProps = {
  title?: string;
  intro?: string;
};

export default function ContactForm({
  title = "Book a discovery call",
  intro = "Share what you need. We'll confirm fit and next steps.",
}: ContactFormProps) {
  return (
    <div className="form-panel">
      <h1>{title}</h1>
      <p>{intro}</p>
      <form
        className="lead-form"
        name="contact-request"
        method="post"
        action="/api/public/contact-request"
      >
        <input type="hidden" name="form-name" value="contact-request" />
        <input type="hidden" name="bot-field" />
        <label className="field">
          <span>Name</span>
          <input type="text" name="name" required />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" required />
        </label>
        <label className="field">
          <span>Phone</span>
          <input type="tel" name="phone" />
        </label>
        <label className="field">
          <span>Company</span>
          <input type="text" name="company" />
        </label>
        <label className="field">
          <span>Location</span>
          <select name="location">
            <option value="">Select state</option>
            <option value="NSW">New South Wales</option>
            <option value="VIC">Victoria</option>
            <option value="QLD">Queensland</option>
            <option value="WA">Western Australia</option>
            <option value="SA">South Australia</option>
            <option value="TAS">Tasmania</option>
            <option value="ACT">Australian Capital Territory</option>
            <option value="NT">Northern Territory</option>
          </select>
        </label>
        <label className="field">
          <span>What you need</span>
          <select name="need">
            <option value="">Select an option</option>
            <option value="design">Design a system</option>
            <option value="build">Build a system</option>
            <option value="fix">Fix a system</option>
            <option value="implement">Implement a system</option>
            <option value="other">Something else</option>
          </select>
        </label>
        <label className="field">
          <span>Preferred Meeting Date/Time</span>
          <input type="datetime-local" name="timing" />
        </label>
        <label className="field">
          <span>Additional context</span>
          <textarea
            name="context"
            rows={3}
            placeholder="Add any details we should know"
          ></textarea>
        </label>
        <button type="submit" className="btn btn-primary">
          Send request
        </button>
        <p className="form-note">
          We respond within 48 hours. Details are only used to reply.
        </p>
      </form>
    </div>
  );
}
