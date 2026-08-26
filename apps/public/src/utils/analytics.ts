declare global {
  interface Window {
    umami?: {
      track: (
        event: string,
        data?: Record<string, string | number | boolean>,
      ) => void;
    };
  }
}

export type PageVote = "positive" | "meh" | "negative";

/**
 * Umami Analytics wrapper
 */
class UmamiAnalytics {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = !import.meta.env.PROD;
  }

  get isAvailable(): boolean {
    return typeof window !== "undefined" && window.umami !== undefined;
  }

  track(
    eventName: string,
    data?: Record<string, string | number | boolean>,
  ): void {
    if (this.isAvailable && window.umami) {
      window.umami.track(eventName, data);
    } else if (this.isDevelopment) {
      console.info(
        `[Analytics] Event: ${eventName}`,
        data ? JSON.stringify(data) : "",
      );
    }
  }

  trackPageFeedback(path: string, vote: PageVote): void {
    const value = vote === "positive" ? 2 : vote === "meh" ? 1 : 0;

    this.track("page_feedback", {
      path,
      vote,
      score: value,
      timestamp: new Date().toISOString(),
    });
  }

  trackButtonClick(
    buttonName: string,
    metadata?: Record<string, string | number | boolean>,
  ): void {
    this.track("button_click", {
      button: buttonName,
      ...metadata,
    });
  }

  trackPageView(pageName: string, path: string): void {
    this.track("page_view", {
      page: pageName,
      path,
    });
  }

  trackUserAction(
    action: string,
    category: string,
    metadata?: Record<string, string | number | boolean>,
  ): void {
    this.track(action, {
      category,
      ...metadata,
    });
  }

  trackDogView(
    dogId: string,
    dogName: string,
    dogAge: string,
    dogSex: string,
    source?: string,
  ): void {
    const formattedSex = dogSex === "Macho" ? "m" : dogSex === "Fêmea" ? "f" : dogSex;

    this.track("dog_view", {
      dog_id: dogId,
      dog_name: dogName,
      dog_age: dogAge,
      dog_sex: formattedSex,
      source: source || "dogs_page",
    });
  }

  trackConversionIntent(
    actionType: "contact" | "adopt_form" | "donation",
    metadata?: Record<string, string | number | boolean>,
  ): void {
    this.track("conversion_intent", {
      action_type: actionType,
      ...metadata,
    });
  }

  trackThemeToggle(newTheme: "light" | "dark"): void {
    this.track("theme_toggle", {
      theme: newTheme,
    });
  }

  trackNoResults(
    context: string,
    metadata?: Record<string, string | number | boolean>,
  ): void {
    this.track("no_results", {
      context,
      ...metadata,
    });
  }
}

export const analytics = new UmamiAnalytics();
