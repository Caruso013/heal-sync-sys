export const masks = {
  phone: (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  },

  cpf: (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
};

export const validate = {
  phone: (value: string): boolean => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  },

  cpf: (value: string): boolean => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned.charAt(9))) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    return digit === parseInt(cleaned.charAt(10));
  }
};

export const unmask = {
  phone: (value: string): string => value.replace(/\D/g, ''),
  cpf: (value: string): string => value.replace(/\D/g, '')
};
