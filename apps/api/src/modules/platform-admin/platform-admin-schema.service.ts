import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// ── Security config ──────────────────────────────────────────────────────────

const HIDDEN_MODELS = new Set(['OtpCode']);

const HIDDEN_FIELDS: Record<string, Set<string>> = {
  WebauthnCredential: new Set(['publicKey', 'credentialId']),
  PushSubscription: new Set(['p256dh', 'auth', 'endpoint']),
  Payment: new Set(['rawWebhookPayload']),
  WebhookEvent: new Set(['rawPayload']),
};

const READ_ONLY_FIELDS = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt']);

const SOFT_DELETE_MODELS = new Set(['Organization', 'User', 'Group', 'Family']);

// ── Hebrew labels ────────────────────────────────────────────────────────────

const MODEL_LABELS: Record<string, string> = {
  Organization: 'עמותה',
  User: 'משתמש',
  Group: 'קבוצה',
  GroupMembership: 'חברות בקבוצה',
  Family: 'משפחה',
  WeeklyOrder: 'הזמנה שבועית',
  WeeklyDistributorAssignment: 'שיבוץ מחלק',
  WeeklyFamilyDelivery: 'חלוקה למשפחה',
  Payment: 'תשלום',
  MonthlyPaymentStatus: 'סטטוס תשלום חודשי',
  PaymentReminder: 'תזכורת תשלום',
  Notification: 'התראה',
  PushSubscription: 'מנוי Push',
  Alert: 'הודעה',
  WebhookEvent: 'אירוע Webhook',
  Asset: 'קובץ',
  LandingPage: 'דף נחיתה',
  LandingPageSection: 'סקשן דף נחיתה',
  Review: 'ביקורת',
  LandingLead: 'ליד',
  WebauthnCredential: 'אימות ביומטרי',
};

// Fields that should render as textarea
const TEXTAREA_FIELD_PATTERNS = [
  'description', 'body', 'notes', 'about', 'message',
  'address', 'content', 'payload', 'json',
];

// ── Display field resolution order ───────────────────────────────────────────

const DISPLAY_FIELD_PRIORITY = [
  'name', 'fullName', 'familyName', 'title', 'slug', 'phone', 'id',
];

// ── Types ────────────────────────────────────────────────────────────────────

export interface FieldMeta {
  name: string;
  type: string;
  kind: 'scalar' | 'enum' | 'object';
  isList: boolean;
  isRequired: boolean;
  isId: boolean;
  isReadOnly: boolean;
  hasDefaultValue: boolean;
  isTextarea: boolean;
  enumValues?: string[];
  relationModel?: string;
  relationFromField?: string;
  displayField?: string;
}

export interface ModelMeta {
  name: string;
  label: string;
  isTenantScoped: boolean;
  hasSoftDelete: boolean;
  fields: FieldMeta[];
}

export interface ModelSummary {
  name: string;
  label: string;
  isTenantScoped: boolean;
  hasSoftDelete: boolean;
  fieldCount: number;
}

@Injectable()
export class PlatformAdminSchemaService {
  private models: Map<string, ModelMeta> = new Map();
  private enums: Map<string, string[]> = new Map();

  constructor() {
    this.loadSchema();
  }

  private loadSchema(): void {
    // Load enums
    for (const e of Prisma.dmmf.datamodel.enums) {
      this.enums.set(e.name, e.values.map((v) => v.name));
    }

    // Load models
    for (const model of Prisma.dmmf.datamodel.models) {
      if (HIDDEN_MODELS.has(model.name)) continue;

      const hiddenFields = HIDDEN_FIELDS[model.name] ?? new Set();
      const fieldNames = model.fields.map((f) => f.name);
      const isTenantScoped = fieldNames.includes('organizationId');
      const hasSoftDelete = SOFT_DELETE_MODELS.has(model.name);

      const fields: FieldMeta[] = [];

      for (const field of model.fields) {
        if (hiddenFields.has(field.name)) continue;
        if (field.kind === 'object' && field.isList) continue; // skip list relations

        const isRelationObject = field.kind === 'object' && !field.isList;

        if (isRelationObject) {
          // For relation objects, include metadata but mark as non-editable
          const relatedModel = Prisma.dmmf.datamodel.models.find(
            (m) => m.name === field.type,
          );
          const relDisplayField = relatedModel
            ? this.resolveDisplayField(relatedModel.fields.map((f) => f.name))
            : 'id';

          fields.push({
            name: field.name,
            type: field.type,
            kind: 'object',
            isList: false,
            isRequired: field.isRequired,
            isId: false,
            isReadOnly: true,
            hasDefaultValue: false,
            isTextarea: false,
            relationModel: field.type,
            relationFromField: field.relationFromFields?.[0],
            displayField: relDisplayField,
          });
          continue;
        }

        const isReadOnly =
          READ_ONLY_FIELDS.has(field.name) ||
          field.isReadOnly ||
          field.isId ||
          (field as { isUpdatedAt?: boolean }).isUpdatedAt === true;

        const isTextarea =
          field.kind === 'scalar' &&
          field.type === 'String' &&
          TEXTAREA_FIELD_PATTERNS.some((p) => field.name.toLowerCase().includes(p));

        const meta: FieldMeta = {
          name: field.name,
          type: field.type,
          kind: field.kind === 'enum' ? 'enum' : 'scalar',
          isList: field.isList,
          isRequired: field.isRequired,
          isId: field.isId,
          isReadOnly,
          hasDefaultValue: field.hasDefaultValue,
          isTextarea,
        };

        if (field.kind === 'enum') {
          meta.enumValues = this.enums.get(field.type) || [];
        }

        // Check if this scalar field is a FK for a relation
        if (field.kind === 'scalar' && field.name.endsWith('Id') && field.name !== 'id') {
          const relationField = model.fields.find(
            (f) =>
              f.kind === 'object' &&
              f.relationFromFields?.includes(field.name),
          );
          if (relationField) {
            const relatedModel = Prisma.dmmf.datamodel.models.find(
              (m) => m.name === relationField.type,
            );
            meta.relationModel = relationField.type;
            meta.displayField = relatedModel
              ? this.resolveDisplayField(relatedModel.fields.map((f) => f.name))
              : 'id';
          }
        }

        fields.push(meta);
      }

      this.models.set(model.name, {
        name: model.name,
        label: MODEL_LABELS[model.name] || model.name,
        isTenantScoped,
        hasSoftDelete,
        fields,
      });
    }
  }

  private resolveDisplayField(fieldNames: string[]): string {
    for (const candidate of DISPLAY_FIELD_PRIORITY) {
      if (fieldNames.includes(candidate)) return candidate;
    }
    return 'id';
  }

  getModels(): ModelSummary[] {
    return Array.from(this.models.values()).map((m) => ({
      name: m.name,
      label: m.label,
      isTenantScoped: m.isTenantScoped,
      hasSoftDelete: m.hasSoftDelete,
      fieldCount: m.fields.length,
    }));
  }

  getModelSchema(modelName: string): ModelMeta | null {
    return this.models.get(modelName) || null;
  }

  isValidModel(modelName: string): boolean {
    return this.models.has(modelName);
  }

  isSoftDeleteModel(modelName: string): boolean {
    return SOFT_DELETE_MODELS.has(modelName);
  }

  /** Convert PascalCase model name to camelCase Prisma delegate key */
  toDelegateKey(modelName: string): string {
    return modelName.charAt(0).toLowerCase() + modelName.slice(1);
  }

  getScalarStringFields(modelName: string): string[] {
    const model = this.models.get(modelName);
    if (!model) return [];
    return model.fields
      .filter((f) => f.kind === 'scalar' && f.type === 'String' && !f.isId)
      .map((f) => f.name);
  }

  getRelationIncludes(modelName: string): Record<string, unknown> {
    const model = this.models.get(modelName);
    if (!model) return {};

    const includes: Record<string, unknown> = {};
    for (const field of model.fields) {
      if (field.kind === 'object' && field.relationModel && field.displayField) {
        includes[field.name] = {
          select: { id: true, [field.displayField]: true },
        };
      }
    }
    return includes;
  }
}
