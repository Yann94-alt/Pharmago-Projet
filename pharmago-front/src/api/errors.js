// Laravel renvoie soit { message }, soit { message, errors: { champ: [messages] } }
export function getErrorMessage(error, fallback = "Une erreur est survenue.") {
  const data = error?.response?.data
  if (!data) return error?.message || fallback

  if (data.errors) {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first)) return first[0]
  }
  if (data.message) return data.message
  if (data.error) return data.error
  return fallback
}
