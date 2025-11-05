import { Schedule } from '../../entities/Schedule.js';

/**
 * Use Case: Update Schedule
 */
export class UpdateScheduleUseCase {
  constructor(schedulesRepository) {
    this.schedulesRepository = schedulesRepository;
  }

  async execute(id, scheduleData, user) {
    // Get existing schedule
    const existing = await this.schedulesRepository.getScheduleById(id);
    if (!existing) {
      throw new Error('Schedule not found');
    }

    // Create Domain Entity with updated data
    const schedule = Schedule.fromPlainObject({
      ...existing,
      ...scheduleData
    });

    // Business validation
    schedule.validate();

    // Auto-update keywords if relevant fields changed
    const relevantFields = ['notes', 'locationName'];
    if (relevantFields.some(field => scheduleData[field] !== undefined)) {
      schedule.keywords = schedule.generateKeywords();
    }

    // Update via repository
    const updatedSchedule = await this.schedulesRepository.updateSchedule(
      id,
      schedule.toPlainObject(),
      user
    );

    // Return as Domain Entity
    if (updatedSchedule instanceof Schedule) {
      return updatedSchedule;
    }
    return Schedule.fromPlainObject(updatedSchedule);
  }
}

