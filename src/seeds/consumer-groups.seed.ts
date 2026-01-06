import { DataSource } from 'typeorm';
import { ConsumerGroup } from '../consumer-groups/entities/consumer-group.entity';

export async function seedConsumerGroups(dataSource: DataSource) {
  const groupRepository = dataSource.getRepository(ConsumerGroup);

  const existingGroups = await groupRepository.count();
  if (existingGroups > 0) {
    console.log('Consumer groups already exist, skipping seed...');
    return;
  }

  const groups = [
    {
      email: 'grupo1@scrumstore.com',
      name: 'Grupo de Consumo Ejemplo',
      description: 'Grupo de consumo de ejemplo para desarrollo',
      city: 'Barcelona',
      address: 'Calle Ejemplo 123',
      isActive: true,
      openingSchedule: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '10:00', close: '14:00', closed: false },
        sunday: { open: '10:00', close: '14:00', closed: true },
      },
    },
  ];

  await groupRepository.save(groups);
  console.log(`Seeded ${groups.length} consumer groups`);
}

