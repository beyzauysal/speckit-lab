/**
 * PasswordService
 * Handles password validation according to security requirements.
 */
export class PasswordService {
  /**
   * Validates a password against security requirements.
   *
   * A valid password must have:
   * - At least 8 characters
   * - At least one lowercase letter (a-z)
   * - At least one uppercase letter (A-Z)
   * - At least one number (0-9)
   * - At least one special character (!@#$%^&*)
   *
   * @param password - The password string to validate
   * @returns true if the password meets all requirements, false otherwise
   */
  validate(password: string): boolean {
    // Check minimum length
    if (password.length < 8) {
      return false;
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      return false;
    }

    // Check for at least one special character
    if (!/[!@#$%^&*]/.test(password)) {
      return false;
    }

    return true;
  }
}
