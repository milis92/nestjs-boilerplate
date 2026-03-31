// Example: additions to src/infra/drizzle/relations.ts for a "widgets" feature
// If the feature has no relations to other domain tables, leave relations.ts unchanged.

import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  widgets: {
    // Add one() or many() relations here when needed
  },
}));
