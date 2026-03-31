"use strict";
// Example: additions to src/infra/drizzle/schema.ts for a "widgets" feature
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.widgets = exports.widgetStatus = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var schema_1 = require("@/infra/drizzle/schema");
var auth_schema_1 = require("@/infra/auth/auth.schema");
// ── Widget Enums ───────────────────────────────────────────────────
exports.widgetStatus = (0, pg_core_1.pgEnum)('widget_status', [
    'active',
    'archived',
]);
// ── Widget Tables ──────────────────────────────────────────────────
exports.widgets = (0, pg_core_1.pgTable)('widgets', __assign({ id: schema_1.primaryId, ownerId: (0, auth_schema_1.withUserId)('cascade'), name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(), description: (0, pg_core_1.text)('description'), status: (0, exports.widgetStatus)('status').notNull().default('active'), priority: (0, pg_core_1.integer)('priority').notNull().default(0) }, schema_1.timestamps), function (t) { return [(0, pg_core_1.index)('widgets_owner_id_idx').on(t.ownerId)]; });
