/**
 * JSON Schema for compiled workflow plans
 * Validates structure produced by compileFlow()
 */
import { JSONSchema7 } from "json-schema";

export const compiledPlanSchema: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["nodes", "edges", "metadata"],
  properties: {
    nodes: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "type", "order"],
        properties: {
          id: { type: "string" },
          type: { 
            type: "string",
            enum: ["Trigger", "PromptLab", "UIAgent", "Guardrail", 
                   "Tool", "Compiler", "Sandbox", "Publisher"]
          },
          config: { type: "object" },
          order: { type: "number", minimum: 0 }
        }
      }
    },
    edges: {
      type: "array",
      items: {
        type: "object",
        required: ["from", "to"],
        properties: {
          from: { type: "string" },
          to: { type: "string" }
        }
      }
    },
    metadata: {
      type: "object",
      required: ["createdAt", "version"],
      properties: {
        createdAt: { type: "string", format: "date-time" },
        version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" }
      }
    }
  }
};