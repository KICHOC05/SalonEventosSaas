import { useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light";

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>("dark");

    useEffect(() => {
        const saved = localStorage.getItem("spacekids-theme") as Theme | null;
        const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;
        const initial = saved ?? (prefersDark ? "dark" : "light");
        setThemeState(initial);
        document.documentElement.setAttribute("data-theme", initial);
    }, []);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        localStorage.setItem("spacekids-theme", t);
        document.documentElement.setAttribute("data-theme", t);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === "dark" ? "light" : "dark");
    }, [theme, setTheme]);

    return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
}