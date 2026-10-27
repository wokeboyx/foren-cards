/** kar****@gmail.com */
export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 3)}****@${domain}`;
}
