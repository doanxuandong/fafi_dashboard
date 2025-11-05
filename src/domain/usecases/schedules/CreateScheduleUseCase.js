import { Schedule } from '../../entities/Schedule.js';

/**
 * Use Case: Create Schedule
 */
export class CreateScheduleUseCase {
  constructor(schedulesRepository) {
    this.schedulesRepository = schedulesRepository;
  }

  async execute(scheduleData, user) {
    // Create Domain Entity
    const schedule = new Schedule(scheduleData);

    // Business validation
    schedule.validate();

    // Auto-generate keywords if not provided
    if (!schedule.keywords || schedule.keywords.length === 0) {
      schedule.keywords = schedule.generateKeywords();
    }

    // Save via repository
    const createdSchedule = await this.schedulesRepository.createSchedule(
      schedule.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (createdSchedule instanceof Schedule) {
      return createdSchedule;
    }
    return Schedule.fromPlainObject(createdSchedule);
  }
}

