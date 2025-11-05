/**
 * Repository Interface for Schedules (Domain Layer)
 */
export class ISchedulesRepository {
  async listSchedules(filters = {}) {
    throw new Error('Not implemented - this is an interface');
  }

  async getScheduleById(id) {
    throw new Error('Not implemented - this is an interface');
  }

  async createSchedule(scheduleData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async updateSchedule(id, scheduleData, user) {
    throw new Error('Not implemented - this is an interface');
  }

  async deleteSchedule(id) {
    throw new Error('Not implemented - this is an interface');
  }
}

