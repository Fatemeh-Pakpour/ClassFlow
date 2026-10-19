// Embedded so error UI stays styled when the root document fails.
export const styles = {
  screen: "cf-error-screen",
  brand: "cf-error-brand",
  card: "cf-error-card",
  icon: "cf-error-icon",
  eyebrow: "cf-error-eyebrow",
  description: "cf-error-description",
  actions: "cf-error-actions",
  primary: "cf-error-primary",
  secondary: "cf-error-secondary",
  note: "cf-error-note",
  footer: "cf-error-footer",
} as const;

export const errorCss = `.cf-error-screen {
  --accent: #4338ca;
  --soft: #eef2ff;
  box-sizing: border-box;
  width: 100%;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: radial-gradient(ellipse at 50% 0%, #e9eaff 0%, transparent 60%), #f8fafc;
  color: #172033;
  font-family: Arial, Helvetica, sans-serif;
}
.cf-error-screen[data-variant="global"] {
  --accent: #9a4513;
  --soft: #fff4e8;
  background: radial-gradient(ellipse at 50% 0%, #ffedda 0%, transparent 60%), #faf9f7;
}
.cf-error-brand { margin-bottom: 36px; font-size: 26px; font-weight: 750; letter-spacing: -1px; }
.cf-error-brand span { color: var(--accent); }
.cf-error-card { position: relative; overflow: hidden; box-sizing: border-box; width: 100%; max-width: 560px; padding: clamp(28px, 6vw, 56px); background: linear-gradient(145deg, #fff, #ffffffed); border: 1px solid #fff; border-radius: 28px; box-shadow: 0 28px 80px -35px #17203340, 0 0 0 1px #17203308; }
.cf-error-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, var(--accent), var(--soft)); }
.cf-error-icon { display: grid; place-items: center; width: 72px; height: 72px; border: 1px solid color-mix(in srgb, var(--accent) 14%, transparent); border-radius: 22px; color: var(--accent); background: var(--soft); margin-bottom: 32px; box-shadow: 0 8px 20px -12px var(--accent); }
.cf-error-eyebrow { color: var(--accent); font-size: 11px; text-transform: uppercase; letter-spacing: 1.8px; font-weight: 700; margin: 0 0 12px; }
.cf-error-card h1 { margin: 0; font-size: clamp(27px, 5vw, 34px); line-height: 1.2; letter-spacing: -1.2px; font-weight: 700; }
.cf-error-description { font-size: 15px; line-height: 1.8; color: #536075; margin: 20px 0 28px; }
.cf-error-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.cf-error-primary, .cf-error-secondary { box-sizing: border-box; display: inline-flex; justify-content: center; align-items: center; gap: 12px; min-height: 46px; padding: 12px 18px; border-radius: 10px; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; transition: background 150ms ease; }
.cf-error-primary { border: 1px solid var(--accent); background: var(--accent); color: #fff; box-shadow: 0 5px 12px -7px var(--accent); }
.cf-error-primary:hover { filter: brightness(.9); }
.cf-error-secondary { border: 1px solid #dce1e9; color: #344156; background: #fff; }
.cf-error-secondary:hover { background: #f1f5f9; }
.cf-error-primary:focus-visible, .cf-error-secondary:focus-visible { outline: 3px solid var(--accent); outline-offset: 4px; }
.cf-error-note { margin: 28px 0 0; padding-top: 22px; border-top: 1px solid #edf0f4; color: #667085; font-size: 12px; line-height: 1.6; }
.cf-error-footer { margin: 28px 0 0; color: #667085; font-size: 12px; text-align: center; line-height: 1.7; }
@media (prefers-color-scheme: dark) {
  .cf-error-screen { background: radial-gradient(ellipse at 50% 0%, #25214b, transparent 65%), #10131c; color: #f1f3fa; --accent: #b7b0ff; --soft: #292544; }
  .cf-error-screen[data-variant="global"] { background: radial-gradient(ellipse at 50% 0%, #3b291f, transparent 65%), #171412; --accent: #f6bb84; --soft: #38281e; }
  .cf-error-card { background: linear-gradient(145deg, #202432, #191d29); border-color: #ffffff14; box-shadow: 0 28px 80px -35px #000; }
  .cf-error-description { color: #bac3d4; }
  .cf-error-primary { color: #171523; }
  .cf-error-secondary { background: #ffffff06; border-color: #ffffff26; color: #e1e6f0; }
  .cf-error-secondary:hover { background: #ffffff12; }
  .cf-error-note { border-color: #ffffff16; }
  .cf-error-note, .cf-error-footer { color: #a4afc2; }
}
@media (max-width: 420px) { .cf-error-actions { flex-direction: column; } }
@media (prefers-reduced-motion: reduce) { .cf-error-primary, .cf-error-secondary { transition: none; } }
`;
