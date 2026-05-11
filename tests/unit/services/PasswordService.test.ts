import { PasswordService } from "../../../src/services/PasswordService";

describe("PasswordService.validate", () => {
  const passwordService = new PasswordService();

  it("should return true when password has 8+ chars, mixed case, number, and special char", () => {
    // Arrange
    const password = "StrongP@ss1";

    // Act
    const isValid = passwordService.validate(password);

    // Assert
    expect(isValid).toBe(true);
  });

  it("should return false when password is shorter than 8 characters", () => {
    // Arrange
    const password = "S@1abC";

    // Act
    const isValid = passwordService.validate(password);

    // Assert
    expect(isValid).toBe(false);
  });

  it("should return false when password does not contain mixed case letters", () => {
    // Arrange
    const noUppercase = "weakp@ss1";

    // Act
    const isValid = passwordService.validate(noUppercase);

    // Assert
    expect(isValid).toBe(false);
  });

  it("should return false when password does not contain a number", () => {
    // Arrange
    const password = "StrongP@ss";

    // Act
    const isValid = passwordService.validate(password);

    // Assert
    expect(isValid).toBe(false);
  });

  it("should return false when password does not contain a special character", () => {
    // Arrange
    const password = "StrongPass1";

    // Act
    const isValid = passwordService.validate(password);

    // Assert
    expect(isValid).toBe(false);
  });
});
