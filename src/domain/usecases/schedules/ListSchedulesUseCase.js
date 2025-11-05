import { Schedule } from '../../entities/Schedule.js';

/**
 * Use Case: List Schedules
 */
export class ListSchedulesUseCase {
  constructor(schedulesRepository) {
    this.schedulesRepository = schedulesRepository;
  }

  async execute(filters = {}) {
    const schedules = await this.schedulesRepository.listSchedules(filters);
    
    // Convert to Domain Entities
    return schedules.map(s => {
      if (s instanceof Schedule) {
        return s;
      }
      return Schedule.fromPlainObject(s);
    });
  }
}

