export function generateOtpCode(length = 6): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
