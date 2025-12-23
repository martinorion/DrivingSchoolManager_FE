import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';

export const usernameValidators = [
  Validators.required,
  Validators.minLength(4),
  Validators.maxLength(20),
  Validators.pattern(/^[a-zA-Z][a-zA-Z0-9._-]*$/),
];

export const passwordValidators = [
  Validators.required,
  Validators.minLength(8),
  Validators.maxLength(30),
  Validators.pattern(/^(?=.*\d)(?=.*[^\w\s]).+$/),
];

export const emailValidators = [Validators.required, Validators.email];

export const phoneValidators = [
  Validators.required,
  Validators.pattern(/^\+?[0-9]{7,15}$/),
];

export const nameValidators = [
  Validators.required,
  Validators.pattern(/^[\p{L}' \-]+$/u),
  Validators.maxLength(15),
];

// Control-level match validator factory: ensures control equals its sibling control value
// Returns a validator function that can be attached to a FormControl to check
// If its value matches that of another control in the same FormGroup.
export function matchValidator(matchToKey: string) {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent; // get parent FormGroup
    if (!parent) return null;
    const match = parent.get(matchToKey); // find sibling control of given key password
    if (!match) return null;
    return control.value === match.value ? null : { passwordMismatch: true }; // Error the key is 'passwordMismatch'
  };
}

// Shared error message resolver. controlName maps to Slovakia locale messages.
export function getErrorMessage(controlName: string, control: AbstractControl, form?: AbstractControl): string | null {
  if (!control) return null;
  const errors = control.errors || {};

  if (errors['required']) {
    switch (controlName) {
      case 'username': return 'Používateľské meno je povinné.';
      case 'firstName': return 'Meno je povinné.';
      case 'surname': return 'Priezvisko je povinné.';
      case 'email': return 'Email je povinný.';
      case 'phone': return 'Telefón je povinný.';
      case 'password': return 'Heslo je povinné.';
      case 'confirmPassword': return 'Potvrdenie hesla je povinné.';
      case 'authority': return 'Rola je povinná.';
      default: return 'Toto pole je povinné.';
    }
  }

  switch (controlName) {
    case 'username': {
      if (errors['minlength']) return 'Používateľské meno musí mať aspoň 4 znaky.';
      if (errors['maxlength']) return 'Používateľské meno môže mať najviac 20 znakov.';
      if (errors['pattern']) return 'Používateľské meno musí začínať písmenom.';
      break;
    }
    case 'firstName':
    case 'surname': {
      if (errors['pattern']) return 'Musí obsahovať len písmená.';
      if (errors['maxlength']) return 'Môže obsahovať najviac 15 znakov.';
      break;
    }
    case 'email': {
      if (errors['email']) return 'Zadajte platný email.';
      break;
    }
    case 'phone': {
      if (errors['pattern']) return 'Zadajte platné telefónne číslo.';
      break;
    }
    case 'password': {
      if (errors['minlength']) return 'Musí obsahovať aspoň 8 znakov.';
      if (errors['maxlength']) return 'Musí obsahovať najviac 30 znakov.';
      if (errors['pattern']) return 'Musí obsahovať číslo a špeciálny znak.';
      break;
    }
    case 'confirmPassword': {
      if (errors['passwordMismatch']) return 'Heslá sa nezhodujú.';
      break;
    }
  }

  // Group-level errors that belong to certain fields
  if (form && (controlName === 'registrationKey')) {
    if (form.errors && (form.errors as any)['registrationKeyRequired']) {
      return 'Pri tejto role je registračný kľúč povinný.';
    }
  }

  return null;
}
