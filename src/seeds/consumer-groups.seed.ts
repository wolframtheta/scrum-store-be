import { DataSource } from 'typeorm';
import { ConsumerGroup } from '../consumer-groups/entities/consumer-group.entity';
import { UserConsumerGroup } from '../consumer-groups/entities/user-consumer-group.entity';

export async function seedConsumerGroups(dataSource: DataSource) {
  const groupRepository = dataSource.getRepository(ConsumerGroup);
  const userGroupRepository = dataSource.getRepository(UserConsumerGroup);

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
    {
      email: 'grupo-prueba@scrumstore.com',
      name: 'Grupo de Consumo de Prueba',
      description: 'Grupo de consumo de prueba para desarrollo',
      city: 'Barcelona',
      address: 'Calle de Prueba 456',
      isActive: true,
      openingSchedule: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '10:00', close: '14:00', closed: false },
        sunday: { closed: true },
      },
    },
  ];

  let createdCount = 0;
  let testGroup: ConsumerGroup | null = null;

  for (const groupData of groups) {
    const existingGroup = await groupRepository.findOne({ where: { email: groupData.email } });
    if (!existingGroup) {
      const group = groupRepository.create(groupData);
      const savedGroup = await groupRepository.save(group);
      createdCount++;
      console.log(`Created consumer group: ${groupData.email}`);

      // Guardar referencia al grupo de prueba
      if (groupData.email === 'grupo-prueba@scrumstore.com') {
        testGroup = savedGroup;
      }
    } else {
      console.log(`Consumer group already exists: ${groupData.email}`);
      if (groupData.email === 'grupo-prueba@scrumstore.com') {
        testGroup = existingGroup;
      }
    }
  }

  // Relacionar el usuario xaviermarques4f@gmail.com con el grupo de prueba
  if (testGroup) {
    const existingRelation = await userGroupRepository.findOne({
      where: {
        userEmail: 'xaviermarques4f@gmail.com',
        consumerGroupId: testGroup.id,
      },
    });

    if (!existingRelation) {
      const userGroup = userGroupRepository.create({
        userEmail: 'xaviermarques4f@gmail.com',
        consumerGroupId: testGroup.id,
        isDefault: true,
        isClient: true,
        isManager: true,
        isPreparer: false,
      });
      await userGroupRepository.save(userGroup);
      console.log(`Linked user xaviermarques4f@gmail.com to test consumer group as manager and client`);
    } else {
      // Actualizar la relación existente para asegurar que sea manager y cliente
      existingRelation.isManager = true;
      existingRelation.isClient = true;
      existingRelation.isDefault = true;
      await userGroupRepository.save(existingRelation);
      console.log(`Updated user relation to test consumer group as manager and client`);
    }
  }

  console.log(`Seeded ${createdCount} new consumer groups`);
}

