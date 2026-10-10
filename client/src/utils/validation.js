// Client-side validation gives instant feedback. It mirrors the server rules
// but is NOT a security control - the API validates everything again.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
}

// Lists the password rules that are still missing (shown live while typing)
export function passwordProblems(password) {
  const problems = [];
  if (password.length < 8) problems.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) problems.push('an uppercase letter');
  if (!/[a-z]/.test(password)) problems.push('a lowercase letter');
  if (!/[0-9]/.test(password)) problems.push('a number');
  return problems;
}

export function validateRegister({ name, email, password, confirmPassword, role }) {
  const errors = {};
  const n = name.trim();
  if (n.length < 2 || n.length > 100) errors.name = 'Name must be between 2 and 100 characters';
  else if (/[<>]/.test(n)) errors.name = 'Name cannot contain < or >';
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (password.length > 128) errors.password = 'Password must be 128 characters or fewer';
  else if (passwordProblems(password).length)
    errors.password = 'Password needs an uppercase letter, a lowercase letter and a number';
  if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match';
  if (!['client', 'freelancer'].includes(role)) errors.role = 'Choose a role';
  return errors;
}

export function validateGig({ title, description, category, price }) {
  const errors = {};
  const t = title.trim();
  const d = description.trim();
  if (t.length < 3 || t.length > 100) errors.title = 'Title must be between 3 and 100 characters';
  if (d.length < 10 || d.length > 2000) errors.description = 'Description must be between 10 and 2000 characters';
  if (!category) errors.category = 'Choose a category';
  const p = Number(price);
  if (price === '' || Number.isNaN(p) || p < 1 || p > 100000)
    errors.price = 'Price must be a number between 1 and 100000';
  return errors;
}

export function validateBookingNotes(notes) {
  return notes.length > 500 ? 'Notes must be 500 characters or fewer' : '';
}
