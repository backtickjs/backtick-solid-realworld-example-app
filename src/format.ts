// As the templates write dates: "January 20, 2026".
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// A profile's picture, or the default one when it has none: null, or cleared
// to "" in the settings.
export function avatarOf(image: string | null) {
  return image || "/default-avatar.svg";
}
