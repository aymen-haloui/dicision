import sql from '@/lib/postgres'
import { seedRules } from './seed-rules'

export async function seedClinicalRules() {
  console.log('🌱 Seeding clinical rules...')

  for (const rule of seedRules) {
    try {
      await sql`
        INSERT INTO clinical_rules (
          name, description, category, severity, priority, enabled, trigger_type,
          conditions, outputs, created_by, version, tags
        ) VALUES (
          ${rule.name},
          ${rule.description || null},
          ${rule.category},
          ${rule.severity},
          ${rule.priority},
          ${rule.enabled},
          ${rule.trigger_type || null},
          ${JSON.stringify(rule.conditions)},
          ${JSON.stringify(rule.outputs)},
          ${rule.created_by || 'system'},
          ${rule.version || 1},
          ${JSON.stringify(rule.tags || [])}
        )
        ON CONFLICT (name) DO UPDATE SET
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          severity = EXCLUDED.severity,
          priority = EXCLUDED.priority,
          enabled = EXCLUDED.enabled,
          trigger_type = EXCLUDED.trigger_type,
          conditions = EXCLUDED.conditions,
          outputs = EXCLUDED.outputs,
          version = EXCLUDED.version + 1,
          tags = EXCLUDED.tags
      `
      console.log(`✅ Seeded: ${rule.name}`)
    } catch (error: any) {
      console.error(`❌ Failed to seed ${rule.name}:`, error.message)
    }
  }

  console.log('✨ Clinical rules seeding complete!')
}
