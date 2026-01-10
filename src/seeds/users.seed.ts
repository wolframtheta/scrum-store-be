import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';

export async function seedUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  const queryRunner = dataSource.createQueryRunner();

  const users = [
    {
      email: 'admin@scrumstore.com',
      name: 'Admin',
      surname: 'System',
      passwordHash: '$2b$10$MvktzzIPZ6Hg7yNbbzqqTOks5dPZi6KctKmu0N14IVWgdWVqBF.8.',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      isActive: true,
    },
    {
      email: 'manager@scrumstore.com',
      name: 'Manager',
      surname: 'Test',
      passwordHash: '$2b$10$yKxuWblwAMXvchLCoHqqnOWG0ePzozcGsXVL7F24eL92r.YoW4OCG',
      roles: [UserRole.ADMIN],
      isActive: true,
    },
    {
      email: 'client@scrumstore.com',
      name: 'Client',
      surname: 'Test',
      passwordHash: '$2b$10$X354dm1TI9R2L9mbPZOA1.ryZHmZaGxSAPJCXjcTHSDHorHphSw4m',
      roles: [UserRole.CLIENT],
      isActive: true,
    },
    {
      email: 'xaviermarques4f@gmail.com',
      name: 'Xavier',
      surname: 'Marques',
      passwordHash: '$2b$10$JnfUdJ02NxQL8NUaH1Tq9.oWMS707BJuvKdFy2epY7IgrMaJK72SC',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      isActive: true,
    },
  ];

  let createdCount = 0;
  for (const userData of users) {
    const existingUser = await userRepository.findOne({ where: { email: userData.email } });
    if (!existingUser) {
      // Insertar directamente con el hash para evitar el doble hasheo del hook
      await queryRunner.query(
        `INSERT INTO "users" ("email", "name", "surname", "password", "roles", "is_active", "created_at", "updated_at")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT ("email") DO NOTHING`,
        [
          userData.email.toLowerCase().trim(),
          userData.name,
          userData.surname,
          userData.passwordHash,
          userData.roles,
          userData.isActive,
        ]
      );
      createdCount++;
      console.log(`Created user: ${userData.email}`);
    } else {
      console.log(`User already exists: ${userData.email}`);
    }
  }

  await queryRunner.release();
  console.log(`Seeded ${createdCount} new users`);
}

