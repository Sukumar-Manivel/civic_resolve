import { ISSUE_CATEGORIES, ISSUE_PRIORITIES, ISSUE_STATUSES, MAX_IMAGE_BYTES } from "../utils/constants.js";

function validateStringField(val, name, min, max) {
  if (typeof val !== "string") {
    return `${name} must be a string`;
  }
  const trimmed = val.trim();
  if (trimmed.length < min || trimmed.length > max) {
    return `${name} length must be between ${min} and ${max} characters`;
  }
  return null;
}

function validateCategory(category) {
  if (category === undefined || category === null || category === "Auto-Detect") {
    return null;
  }
  if (!ISSUE_CATEGORIES.includes(category)) {
    return `category must be one of: ${ISSUE_CATEGORIES.join(", ")}`;
  }
  return null;
}

function validateImagePayload(image) {
  if (!image) return null;
  if (typeof image !== "string") return "image must be a base64 data URI string";
  const regex = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/;
  if (!regex.test(image)) {
    return "image must be a valid base64 data URI with MIME type png, jpeg, or webp";
  }
  const base64Data = image.split(",")[1];
  const sizeInBytes = (base64Data.length * 3) / 4;
  if (sizeInBytes > MAX_IMAGE_BYTES) {
    return "image size exceeds 512KB limit";
  }
  return null;
}

export function validateCreateIssue(req, res, next) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "Validation failed", details: ["Request body must be a JSON object"] });
  }
  const errors = [
    validateStringField(req.body.title, "title", 3, 100),
    validateStringField(req.body.description, "description", 5, 1000),
    validateStringField(req.body.location, "location", 3, 120),
    validateCategory(req.body.category),
    validateImagePayload(req.body.image)
  ].filter(Boolean);

  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }
  next();
}

function validateOptionalEnum(val, allowedValues, fieldName) {
  if (val === undefined) return null;
  if (!allowedValues.includes(val)) {
    return `${fieldName} must be one of: ${allowedValues.join(", ")}`;
  }
  return null;
}

function validateOptionalDepartment(dept) {
  if (dept === undefined) return null;
  return validateStringField(dept, "department", 3, 100);
}

function validateOptionalNotes(notes) {
  if (notes === undefined) return null;
  if (typeof notes !== "string") {
    return "resolutionNotes must be a string";
  }
  return null;
}

function checkUpdateFields(body) {
  return [
    validateOptionalEnum(body.status, ISSUE_STATUSES, "status"),
    validateOptionalEnum(body.priority, ISSUE_PRIORITIES, "priority"),
    validateOptionalDepartment(body.department),
    validateOptionalNotes(body.resolutionNotes)
  ].filter(Boolean);
}

export function validateUpdateIssueStatus(req, res, next) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "Validation failed", details: ["Request body must be a JSON object"] });
  }
  const allowedKeys = ["status", "priority", "department", "resolutionNotes"];
  const presentKeys = allowedKeys.filter((key) => req.body[key] !== undefined);
  if (presentKeys.length === 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: ["At least one field (status, priority, department, resolutionNotes) must be provided"]
    });
  }
  const errors = checkUpdateFields(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }
  next();
}
