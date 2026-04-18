import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import commonEs from "./locales/es/common.json";
import todoEs from "./locales/es/todo.json";
import journalEs from "./locales/es/journal.json";
import commonEn from "./locales/en/common.json";
import todoEn from "./locales/en/todo.json";
import journalEn from "./locales/en/journal.json";

i18n.use(initReactI18next).init({
  resources: {
    es: {
      common: commonEs,
      todo: todoEs,
      journal: journalEs,
    },
    en: {
      common: commonEn,
      todo: todoEn,
      journal: journalEn,
    },
  },
  lng: "en",
  fallbackLng: ["en"],
  ns: ["common", "todo", "journal"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
