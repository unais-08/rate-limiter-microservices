/**
 * Business logic for backend service operations
 * This is a dummy service representing a protected backend
 */

class BackendService {
  /**
   * Simulate fetching user data
   */
  async getUserData(userId) {
    // Simulate database latency
    await this._simulateLatency(50);

    return {
      userId,
      username: `user_${userId}`,
      email: `user${userId}@example.com`,
      createdAt: new Date().toISOString(),
      role: "user",
    };
  }

  /**
   * Simulate processing some data
   */
  async processData(data) {
    await this._simulateLatency(100);

    return {
      processed: true,
      originalData: data,
      processedAt: new Date().toISOString(),
      result: `Processed ${JSON.stringify(data).length} bytes`,
    };
  }

  /**
   * Simulate listing resources
   */
  async listResources(limit = 10, offset = 0) {
    await this._simulateLatency(75);

    const resources = Array.from({ length: limit }, (_, i) => ({
      id: offset + i + 1,
      name: `Resource ${offset + i + 1}`,
      status: "active",
      createdAt: new Date(
        Date.now() - Math.random() * 10000000000,
      ).toISOString(),
    }));

    return {
      resources,
      total: 1000,
      limit,
      offset,
    };
  }

  /**
   * Simulate creating a resource
   */
  async createResource(resourceData) {
    await this._simulateLatency(120);

    return {
      id: Math.floor(Math.random() * 10000),
      ...resourceData,
      status: "created",
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Simulate updating a resource
   */
  async updateResource(resourceId, updates) {
    await this._simulateLatency(90);

    return {
      id: resourceId,
      ...updates,
      status: "updated",
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Simulate deleting a resource
   */
  async deleteResource(resourceId) {
    await this._simulateLatency(60);

    return {
      id: resourceId,
      status: "deleted",
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * Simulate database or processing latency
   */
  async _simulateLatency(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new BackendService();
