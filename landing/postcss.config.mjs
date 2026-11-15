// Tailwind runs through PostCSS (the setup Next's docs describe). The
// Turbopack loader the scaffold shipped with did not pick up CSS edits in dev.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
