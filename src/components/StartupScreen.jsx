import logo from '../../assets/WhatsApp Image 2026-11-06 at 10.46.19 PM.jpeg';

export default function StartupScreen() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center" dir="rtl">
      <img
        className="h-36 w-36 animate-pulse rounded-full object-cover shadow-xl sm:h-44 sm:w-44"
        src={logo}
        alt="شعار نختُم معاً"
      />
      <h1 className="text-3xl font-extrabold text-leaf-800">نختُم معاً</h1>
      <p className="text-stone-600">مساحة للخير والأجر</p>
    </main>
  );
}
