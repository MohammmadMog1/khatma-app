const CONTACTS = [
  { number: '+963 994 835 919', whatsapp: '963994835919' },
  { number: '+963 965 377 978', whatsapp: '963965377978' },
];

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-leaf-200/80 py-8 text-center" dir="rtl">
      <h2 className="text-xl font-extrabold text-leaf-800">تواصل معنا</h2>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {CONTACTS.map((contact) => (
          <a
            key={contact.whatsapp}
            className="inline-flex min-w-56 items-center justify-center gap-3 rounded-2xl border border-green-200 bg-white px-5 py-3 text-green-800 shadow-sm transition hover:border-green-400 hover:bg-green-50"
            href={`https://wa.me/${contact.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`راسلنا على واتساب على الرقم ${contact.number}`}
          >
            <svg
              className="h-6 w-6 shrink-0 text-green-600"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20.5 11.7a8.6 8.6 0 0 1-12.7 7.6L3 20.5l1.3-4.6a8.6 8.6 0 1 1 16.2-4.2Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.2 7.7c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4 0 .6l-.6.7c-.2.2-.2.4-.1.6.6 1 1.4 1.8 2.4 2.4.2.1.4.1.6-.1l.8-.9c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5 0 .3-.2 1.3-.8 1.7-.5.4-1.2.6-2 .4-1-.2-2.2-.8-3.5-2-1.5-1.3-2.4-2.8-2.7-3.9-.3-1 .1-1.9.6-2.4Z"
                fill="currentColor"
              />
            </svg>
            <span className="text-sm font-bold">راسلنا واتساب</span>
            <span className="font-extrabold tracking-wide" dir="ltr">{contact.number}</span>
          </a>
        ))}
      </div>
      <p className="mt-4 text-sm text-stone-500">نختُم معاً</p>
      <p className="mt-2 text-sm font-bold text-leaf-700">لا تنسونا من صالح دعائكم</p>
    </footer>
  );
}
