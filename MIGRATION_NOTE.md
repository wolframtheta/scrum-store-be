# Migration: Add ID to Users Table

## ⚠️ IMPORTANT: Database Migration Required

The User entity has been updated to use a UUID `id` as the primary key instead of `email`.

### Changes Made:
- Added `id` UUID column as PRIMARY KEY
- Changed `email` from PRIMARY KEY to UNIQUE column
- All existing functionality preserved (search by email still works)

### Migration Steps:

#### Option 1: Drop and Recreate (Development Only - DATA LOSS)
```bash
# In development environment only
npm run typeorm:drop
npm run typeorm:sync
```

#### Option 2: Manual Migration (Production Safe)

Create a migration file:
```bash
npm run typeorm:migration:create -- src/migrations/AddUserIdColumn
```

Then implement the migration:

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIdColumn1234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add new id column
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "id" uuid DEFAULT uuid_generate_v4()
        `);

        // 2. Drop existing primary key constraint on email
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP CONSTRAINT IF EXISTS "PK_users"
        `);

        // 3. Make id NOT NULL after it's populated
        await queryRunner.query(`
            ALTER TABLE "users" 
            ALTER COLUMN "id" SET NOT NULL
        `);

        // 4. Set id as new primary key
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "PK_users" PRIMARY KEY ("id")
        `);

        // 5. Add unique constraint to email
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")
        `);

        // 6. Update foreign keys in related tables (if using email as FK)
        // Note: UserConsumerGroup and RefreshToken currently use email
        // These will continue to work but should be updated in future
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse migration
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_users_email"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "PK_users"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "PK_users" PRIMARY KEY ("email")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);
    }
}
```

Run the migration:
```bash
npm run typeorm:migration:run
```

### Related Tables to Update (Future):

These tables currently use `userEmail` as foreign key and should be migrated to use `userId`:

1. **user_consumer_groups**
   - Change `userEmail` → `userId` (uuid)

2. **refresh_tokens**
   - Change `userEmail` → `userId` (uuid)

### Testing:

After migration, verify:
- [ ] Login works correctly
- [ ] User profile loads
- [ ] Consumer group memberships work
- [ ] Refresh tokens work
- [ ] Admin user management works

### Rollback Plan:

If issues occur, run:
```bash
npm run typeorm:migration:revert
```

This will restore the original structure with `email` as primary key.


