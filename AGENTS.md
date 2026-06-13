# Agent Preferences

- Completion screens must never auto-redirect or auto-restart.
- Once a completion screen appears, it stays visible until the user presses a button.
- Use the shared reusable completion screen for activities that award points, hearts, or tribe points.
- Heart changes must update the central `userCourseProgress.hearts` value and should be reflected immediately in the sidebar/footer.
- Do not add local or duplicate heart counters in activity UIs unless the user explicitly asks for them.
- Keep completion UI consistent across activities unless the user asks for a specific exception.
- New routes must use the shared Torah scroll loader (`components/hebrew/hebrew-loader.tsx`) in `loading.tsx`; never use a simple spinner for route loading screens.
