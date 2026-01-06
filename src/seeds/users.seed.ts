import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export async function seedUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  const existingUsers = await userRepository.count();
  if (existingUsers > 0) {
    console.log('Users already exist, skipping seed...');
    return;
  }

  const users = [
    {
      email: 'admin@scrumstore.com',
      name: 'Admin',
      surname: 'System',
      password: await bcrypt.hash('admin123', 10),
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      isActive: true,
    },
    {
      email: 'manager@scrumstore.com',
      name: 'Manager',
      surname: 'Test',
      password: await bcrypt.hash('manager123', 10),
      roles: [UserRole.ADMIN],
      isActive: true,
    },
    {
      email: 'client@scrumstore.com',
      name: 'Client',
      surname: 'Test',
      password: await bcrypt.hash('client123', 10),
      roles: [UserRole.CLIENT],
      isActive: true,
    },
  ];

  await userRepository.save(users);
  console.log(`Seeded ${users.length} users`);
}

