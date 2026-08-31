export const ADOPTION_RECAPTCHA_ACTION = "submit_adoption";

export const RECAPTCHA_SCRIPT_ID = "recaptcha-v3-script";

const RECAPTCHA_HOSTS = new Set(["www.google.com", "www.gstatic.com"]);

function isRecaptchaResource(element: HTMLScriptElement | HTMLIFrameElement) {
  try {
    const url = new URL(element.src);
    return RECAPTCHA_HOSTS.has(url.hostname) && url.pathname.includes("/recaptcha/");
  } catch {
    return false;
  }
}

export function cleanupRecaptcha() {
  document
    .querySelectorAll<HTMLScriptElement | HTMLIFrameElement>("script[src], iframe[src]")
    .forEach((element) => {
      if (isRecaptchaResource(element)) {
        element.remove();
      }
    });

  document
    .querySelectorAll(
      '.grecaptcha-badge, [id^="google_recaptcha_"], textarea[name^="g-recaptcha-response"]',
    )
    .forEach((element) => element.remove());

  Reflect.deleteProperty(window, "grecaptcha");
  Reflect.deleteProperty(window, "___grecaptcha_cfg");
}

export function loadRecaptcha(siteKey: string) {
  if (!document.getElementById(RECAPTCHA_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    document.body.appendChild(script);
  }

  return cleanupRecaptcha;
}
