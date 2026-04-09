import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import commonEs from "./locales/es/common.json";
import todoEs from "./locales/es/todo.json";
import commonEn from "./locales/en/common.json";
import todoEn from "./locales/en/todo.json";

i18n.use(initReactI18next).init({
  resources: {
    es: {
      common: commonEs,
      todo: todoEs,
    },
    en: {
      common: commonEn,
      todo: todoEn,
    },
  },
  lng: "es",
  fallbackLng: ["es"],
  ns: ["common", "todo"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
