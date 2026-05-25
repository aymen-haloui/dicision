import sql from '@/lib/postgres'
import { seedRules } from './seed-rules'
import { inferRuleFamily } from './rule-family'

export async function seedClinicalRules() {
  console.log('🌱 Seeding clinical rules...')

  for (const rule of seedRules) {
    const ruleFamily = rule.rule_family || inferRuleFamily(rule)
    const explanationTemplate = rule.explanation_template || `La règle ${rule.name} (${ruleFamily}) s'est déclenchée sur le contexte clinique.`
    try {
      await sql`
        INSERT INTO clinical_rules (
          name, description, rule_family, category, severity, priority, enabled, trigger_type,
          explanation_template, conditions, outputs, created_by, version, tags, updated_at
        ) VALUES (
          ${rule.name},
          ${rule.description || null},
          ${ruleFamily},
          ${rule.category},
          ${rule.severity},
          ${rule.priority},
          ${rule.enabled},
          ${rule.trigger_type || null},
          ${explanationTemplate},
          ${JSON.stringify(rule.conditions)},
          ${JSON.stringify(rule.outputs)},
          ${rule.created_by || 'system'},
          ${rule.version || 1},
          ${JSON.stringify(rule.tags || [])},
          NOW()
        )
        ON CONFLICT (name) DO UPDATE SET
          description = EXCLUDED.description,
          rule_family = EXCLUDED.rule_family,
          category = EXCLUDED.category,
          severity = EXCLUDED.severity,
          priority = EXCLUDED.priority,
          enabled = EXCLUDED.enabled,
          trigger_type = EXCLUDED.trigger_type,
          explanation_template = EXCLUDED.explanation_template,
          conditions = EXCLUDED.conditions,
          outputs = EXCLUDED.outputs,
          version = EXCLUDED.version + 1,
            tags = EXCLUDED.tags,
            updated_at = NOW()
      `
      console.log(`✅ Seeded: ${rule.name}`)
    } catch (error: any) {
      console.error(`❌ Failed to seed ${rule.name}:`, error.message)
    }
  }

  console.log('✨ Clinical rules seeding complete!')
}
