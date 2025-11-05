/**
 * Use Case: Delete Schedule
 */
export class DeleteScheduleUseCase {
  constructor(schedulesRepository) {
    this.schedulesRepository = schedulesRepository;
  }

  async execute(id) {
    // Check if schedule exists
    const schedule = await this.schedulesRepository.getScheduleById(id);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Delete via repository
    await this.schedulesRepository.deleteSchedule(id);
  }
}

