import "@testing-library/jest-dom/vitest";
// Initializes i18next once for the whole test run, so components using
// useTranslation() render real English text instead of raw "a.b.c" keys.
import "../i18n";
