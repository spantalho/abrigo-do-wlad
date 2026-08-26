import React from "react";

type VLibrasWindow = Window &
  typeof globalThis & {
    VLibras?: {
      Widget: new (options: { rootPath: string; position: string }) => unknown;
    };
  };

let vlibrasInitialized = false;

export const VLibrasWidget = () => {
  React.useEffect(() => {
    const initializeVLibras = () => {
      if (vlibrasInitialized) {
        return;
      }

      const VLibras = (window as VLibrasWindow).VLibras;

      if (!VLibras?.Widget) {
        return;
      }

      new VLibras.Widget({
        rootPath: "https://vlibras.gov.br/app",
        position: "BL",
      });
      vlibrasInitialized = true;
    };

    initializeVLibras();
    window.addEventListener("load", initializeVLibras);

    return () => {
      window.removeEventListener("load", initializeVLibras);
    };
  }, []);

  return React.createElement(
    "div",
    { vw: "", className: "enabled" } as React.HTMLAttributes<HTMLDivElement>,
    React.createElement("div", { "vw-access-button": "", className: "active" } as React.HTMLAttributes<HTMLDivElement>),
    React.createElement(
      "div",
      { "vw-plugin-wrapper": "" } as React.HTMLAttributes<HTMLDivElement>,
      React.createElement("div", { className: "vw-plugin-top-wrapper" })
    )
  );
};
