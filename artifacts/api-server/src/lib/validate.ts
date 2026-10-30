import type { Request, Response, NextFunction } from "express";

type FieldRule = "text" | "optionalText" | "id" | "optionalId" | "money" | "status" | "priority" | "gateType" | "stringArray" | "lineItems" | "boolean" | "userRole";
const statuses = ["scheduled", "in_progress", "paused", "completed", "cancelled"];
const priorities = ["low", "medium", "high", "urgent"];
const gateTypes = ["single_gate","dual_gate","sliding_gate","commercial","access_control","intercom","repair","maintenance","new_installation"];
const valid = (value: unknown, rule: FieldRule): boolean => {
  if (rule.startsWith("optional") && value === null) return true;
  if (rule === "text" || rule === "optionalText") return typeof value === "string" && value.length <= 5000;
  if (rule === "id" || rule === "optionalId") return Number.isSafeInteger(value) && Number(value) > 0;
  if (rule === "money") return (typeof value === "number" || typeof value === "string") && /^\d{1,8}(\.\d{1,2})?$/.test(String(value));
  if (rule === "status") return typeof value === "string" && statuses.includes(value);
  if (rule === "priority") return typeof value === "string" && priorities.includes(value);
  if (rule === "gateType") return typeof value === "string" && gateTypes.includes(value);
  if (rule === "userRole") return typeof value === "string" && ["admin","manager","supervisor","crew","client"].includes(value);
  if (rule === "boolean") return typeof value === "boolean";
  if (rule === "stringArray") return Array.isArray(value) && value.length <= 20 && value.every(v => typeof v === "string" && v.length <= 2048);
  if (rule === "lineItems") return Array.isArray(value) && value.length <= 100 && value.every(v => v && typeof v === "object" && typeof v.description === "string" && v.description.length <= 500 && Number.isFinite(v.quantity) && v.quantity > 0 && Number.isFinite(v.unitPrice) && v.unitPrice >= 0 && Number.isFinite(v.total) && v.total >= 0);
  return false;
};

export function validateFields(fields: Record<string, FieldRule>, required: string[] = []) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      res.status(400).json({ error: "Expected JSON object" }); return;
    }
    for (const [key, value] of Object.entries(req.body)) {
      if (!Object.prototype.hasOwnProperty.call(fields, key) || !valid(value, fields[key])) {
        res.status(400).json({ error: "Invalid or unauthorized field", field: key }); return;
      }
    }
    if (required.some(key => !(key in req.body))) {
      res.status(400).json({ error: "Missing required fields" }); return;
    }
    next();
  };
}
